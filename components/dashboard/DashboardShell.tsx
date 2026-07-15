"use client";

import { useEffect, useMemo, useState } from "react";
import type { BulkActionType, ScanResult, SenderActionResultItem, SenderSummary } from "@/types/gmail";
import { ApiError, fetchScan, postSenderAction } from "@/lib/api/client";
import { useToast } from "@/components/ui/ToastProvider";
import { DashboardHeader } from "./DashboardHeader";
import { SearchBar } from "./SearchBar";
import { SortControls, type SortKey } from "./SortControls";
import { SenderRow } from "./SenderRow";
import { BulkActionBar } from "./BulkActionBar";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { SenderDetailModal } from "@/components/senders/SenderDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { pluralize } from "@/lib/utils";

const PAGE_SIZE = 20;
const EMPTY_SENDERS: SenderSummary[] = [];

type Status = "loading" | "error" | "ready";

interface PendingConfirm {
  type: BulkActionType;
  senders: SenderSummary[];
}

function applyActionResults(senders: SenderSummary[], results: SenderActionResultItem[]): SenderSummary[] {
  const resultByEmail = new Map(results.map((r) => [r.email, r]));

  const next: SenderSummary[] = [];
  for (const sender of senders) {
    const result = resultByEmail.get(sender.senderEmail);
    if (!result || result.succeeded === 0) {
      next.push(sender);
      continue;
    }
    if (result.succeeded >= sender.messageIds.length) {
      // Every scanned message for this sender was handled — drop it from the list.
      continue;
    }
    // Partial success: keep the sender with a reduced count.
    next.push({
      ...sender,
      messageCount: sender.messageCount - result.succeeded,
      messageIds: sender.messageIds.slice(result.succeeded),
    });
  }
  return next;
}

export function DashboardShell({ mockMode }: { mockMode: boolean }) {
  const { showToast } = useToast();

  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("count");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [detailEmail, setDetailEmail] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  async function runScan(isRefresh: boolean) {
    if (isRefresh) setRefreshing(true);
    else setStatus("loading");
    try {
      const result = await fetchScan();
      setScan(result);
      setStatus("ready");
      setSelected(new Set());
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Couldn't scan your mailbox. Please try again.");
      setStatus("error");
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchScan()
      .then((result) => {
        if (cancelled) return;
        setScan(result);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Couldn't scan your mailbox. Please try again.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const senders = useMemo(() => scan?.senders ?? EMPTY_SENDERS, [scan]);

  const filteredSorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? senders.filter(
          (s) =>
            s.senderName.toLowerCase().includes(query) ||
            s.senderEmail.toLowerCase().includes(query) ||
            s.domain.toLowerCase().includes(query),
        )
      : senders;

    const sorted = [...filtered];
    if (sortKey === "count") sorted.sort((a, b) => b.messageCount - a.messageCount);
    else if (sortKey === "name") sorted.sort((a, b) => (a.senderName || a.senderEmail).localeCompare(b.senderName || b.senderEmail));
    else if (sortKey === "recent") sorted.sort((a, b) => (b.mostRecentDate ?? "").localeCompare(a.mostRecentDate ?? ""));
    return sorted;
  }, [senders, search, sortKey]);

  const visible = filteredSorted.slice(0, visibleCount);
  const detailSender = senders.find((s) => s.senderEmail === detailEmail) ?? null;

  function toggleSelect(email: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function requestBulkAction(type: BulkActionType) {
    const targeted = senders.filter((s) => selected.has(s.senderEmail));
    if (targeted.length === 0) return;
    setPendingConfirm({ type, senders: targeted });
  }

  function requestSingleSenderAction(type: BulkActionType, sender: SenderSummary) {
    setPendingConfirm({ type, senders: [sender] });
  }

  async function confirmPendingAction() {
    if (!pendingConfirm || isSubmittingAction) return;
    setIsSubmittingAction(true);
    try {
      const response = await postSenderAction(
        pendingConfirm.type,
        pendingConfirm.senders.map((s) => ({ email: s.senderEmail, messageIds: s.messageIds })),
      );

      setScan((current) => (current ? { ...current, senders: applyActionResults(current.senders, response.results) } : current));

      const totalRequested = response.results.reduce((sum, r) => sum + r.requested, 0);
      const totalSucceeded = response.results.reduce((sum, r) => sum + r.succeeded, 0);
      const totalFailed = totalRequested - totalSucceeded;
      const verb = pendingConfirm.type === "archive" ? "Archived" : "Moved to Trash";
      const senderCount = pendingConfirm.senders.length;

      if (totalFailed === 0) {
        showToast(
          `${verb} ${totalSucceeded} ${pluralize(totalSucceeded, "email")} from ${senderCount} ${pluralize(senderCount, "sender")}.`,
          "success",
        );
      } else if (totalSucceeded === 0) {
        showToast(`Couldn't ${pendingConfirm.type} those emails. Please try again.`, "error");
      } else {
        showToast(`${verb} ${totalSucceeded} of ${totalRequested} emails — ${totalFailed} failed. You can retry those.`, "error");
      }

      setSelected(new Set());
      if (detailEmail && pendingConfirm.senders.some((s) => s.senderEmail === detailEmail)) {
        setDetailEmail(null);
      }
      setPendingConfirm(null);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Something went wrong. Please try again.", "error");
    } finally {
      setIsSubmittingAction(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8">
        <ErrorState message={errorMessage} onRetry={() => runScan(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader mockMode={mockMode} onRefresh={() => runScan(true)} refreshing={refreshing} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6 sm:px-8">
        {scan && (
          <p className="mb-4 text-xs text-foreground/50">
            Scanned {scan.scannedCount} {pluralize(scan.scannedCount, "email")} across {senders.length}{" "}
            {pluralize(senders.length, "sender")}
            {scan.truncated ? ` (limit of ${scan.limit} reached — refresh to scan more)` : ""}.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} />
          <SortControls sortKey={sortKey} onChange={setSortKey} />
        </div>

        <div className="mt-4">
          {senders.length === 0 ? (
            <EmptyState
              title="Your inbox is looking clean"
              description="We didn't find any inbox messages to group. Try refreshing the scan if you expect senders here."
            />
          ) : filteredSorted.length === 0 ? (
            <EmptyState title="No matching senders" description="Try a different search term." />
          ) : (
            <div className="space-y-2">
              {visible.map((sender) => (
                <SenderRow
                  key={sender.senderEmail}
                  sender={sender}
                  selected={selected.has(sender.senderEmail)}
                  onToggleSelect={toggleSelect}
                  onOpenDetails={setDetailEmail}
                />
              ))}
            </div>
          )}

          {visibleCount < filteredSorted.length && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/70 ring-1 ring-border hover:bg-surface-muted"
              >
                Load more ({filteredSorted.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>

        <BulkActionBar
          selectedCount={selected.size}
          onArchive={() => requestBulkAction("archive")}
          onTrash={() => requestBulkAction("trash")}
          onClear={clearSelection}
          disabled={isSubmittingAction}
        />
      </main>

      <SenderDetailModal
        sender={detailSender}
        onClose={() => setDetailEmail(null)}
        onArchiveAll={(sender) => requestSingleSenderAction("archive", sender)}
        onTrashAll={(sender) => requestSingleSenderAction("trash", sender)}
        actionsDisabled={isSubmittingAction}
      />

      <ConfirmDialog
        open={pendingConfirm !== null}
        title={pendingConfirm ? confirmTitle(pendingConfirm) : ""}
        description={pendingConfirm ? confirmDescription(pendingConfirm) : ""}
        details={pendingConfirm?.senders.slice(0, 8).map((s) => `${s.senderName || s.senderEmail} — ${s.messageCount} ${pluralize(s.messageCount, "email")}`)}
        confirmLabel={pendingConfirm?.type === "trash" ? "Move to Trash" : "Archive"}
        tone={pendingConfirm?.type === "trash" ? "danger" : "default"}
        isSubmitting={isSubmittingAction}
        onConfirm={confirmPendingAction}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
}

function confirmTitle(pending: PendingConfirm): string {
  const senderCount = pending.senders.length;
  const verb = pending.type === "archive" ? "Archive" : "Move to Trash";
  return senderCount === 1 ? `${verb}: ${pending.senders[0].senderName || pending.senders[0].senderEmail}` : `${verb} ${senderCount} senders`;
}

function confirmDescription(pending: PendingConfirm): string {
  const totalMessages = pending.senders.reduce((sum, s) => sum + s.messageCount, 0);
  const senderCount = pending.senders.length;
  const action = pending.type === "archive" ? "archived" : "moved to Trash";
  return `${totalMessages} ${pluralize(totalMessages, "email")} from ${senderCount} ${pluralize(senderCount, "sender")} will be ${action}.`;
}
