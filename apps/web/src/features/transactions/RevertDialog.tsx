'use client';

import { useEffect, useRef, useState } from 'react';
import { useVaultAction } from '@/lib/vault-client';
import styles from './RevertDialog.module.scss';

export interface RevertTarget {
  id: string;
  /** e.g. "TEST A, ₹1,200 on Mon, 9 Nov." */
  summary: string;
}

interface RevertDialogProps {
  target: RevertTarget | null;
  onClose: () => void;
}

/** Confirms, then takes a payment back: the bill is unpaid again and next month's bill is removed. */
export default function RevertDialog({ target, onClose }: RevertDialogProps) {
  const act = useVaultAction();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (target && !d.open) {
      setError(null);
      d.showModal();
    }
    if (!target && d.open) d.close();
  }, [target]);

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      await act((v) => v.undoPayment(target.id));
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.confirm}
      aria-labelledby="revert-title"
      onClose={onClose}
    >
      <h2 id="revert-title" className={styles.title}>
        Revert this payment?
      </h2>
      <p className={styles.text}>
        {target?.summary} The bill goes back to unpaid, the payment is removed from Spends, and next
        month&apos;s bill is taken away again.
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.btnDanger} onClick={confirm} disabled={busy}>
          {busy ? 'Reverting…' : 'Revert payment'}
        </button>
        <button type="button" className={styles.btnText} onClick={onClose}>
          Keep it
        </button>
      </div>
    </dialog>
  );
}
