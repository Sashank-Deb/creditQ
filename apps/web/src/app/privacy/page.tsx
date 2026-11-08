import type { Metadata } from 'next';
import LegalPage from '@/features/legal/LegalPage';

export const metadata: Metadata = { title: 'Privacy policy · CreditQ' };

export default function Page() {
  return (
    <LegalPage title="Privacy policy" updated="8 November 2026">
      <p>
        CreditQ (&ldquo;Credit Queue&rdquo;) helps you remember to pay credit card bills. It is
        built so that your information stays on your own device. This page explains exactly what
        that means.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>
          <strong>We do not have your data.</strong> There is no account and no CreditQ server that
          stores your cards, bills or payments.
        </li>
        <li>
          <strong>We never ask for a full card number</strong>, a CVV, a PIN, a password or your
          bank login. Only the last 4 digits.
        </li>
        <li>
          <strong>No analytics, no ads, no trackers.</strong> Nothing is sold or shared.
        </li>
      </ul>

      <h2>What the app stores, and where</h2>
      <p>
        Everything below is saved only in your browser&apos;s own storage on this device
        (IndexedDB), never uploaded:
      </p>
      <ul>
        <li>The cards you add: bank, card name, last 4 digits, colour and pattern.</li>
        <li>Bill dates: the statement date and the payment due date.</li>
        <li>
          Payments you mark as paid, including the amount if you choose to enter one. Entering an
          amount is optional.
        </li>
        <li>Your settings: reminder lead days, reminder time and the card-names switch.</li>
      </ul>
      <p>
        Cards, bills and payments are encrypted with AES-256-GCM before they are written. The
        encryption key is created on your device and cannot be exported. Dates and ids are kept
        readable so the app can sort and find records; names, last 4 digits and amounts are
        encrypted. Your theme choice is stored as a plain setting in local storage.
      </p>

      <h2>Reminders and notifications</h2>
      <p>
        Reminders are worked out on your device. Notifications are shown by your browser or the
        installed app; they never include amounts. By default they also leave out card names. If you
        turn on &ldquo;Show card names in reminders&rdquo;, names appear in notifications shown on
        this device.
      </p>

      <h2>Calendar export</h2>
      <p>
        When you export to your calendar, CreditQ creates a file on your device. Each pay day
        becomes a full-day event listing your card names, the last 4 digits and the due dates. No
        amounts are included. Once you open that file in a calendar app, that app (and its cloud, if
        it syncs, such as Apple iCloud or Google Calendar) holds those events under its own privacy
        policy. If that worries you, do not export, or remove the events later.
      </p>

      <h2>Backups you create</h2>
      <p>
        Export creates a file that is locked with a passphrase you choose, using a key derived from
        the passphrase. We cannot open it and cannot recover a forgotten passphrase. Where you save
        or send that file is up to you.
      </p>

      <h2>Hosting</h2>
      <p>
        The app&apos;s files are served by a hosting provider (Vercel). Like any website host, it
        may keep ordinary server logs such as your IP address and the pages requested. Those logs do
        not contain your cards or bills, because that data never leaves your device. Fonts are
        bundled with the app and are not loaded from a third party.
      </p>

      <h2>Deleting your data</h2>
      <p>
        Settings has a &ldquo;Delete all data&rdquo; button that removes everything from this
        device, including the encryption key. Clearing your browser&apos;s site data does the same.
        Because there is no server copy, deleted data cannot be recovered unless you kept an
        exported backup.
      </p>

      <h2>Children</h2>
      <p>CreditQ is meant for adults who manage their own credit cards.</p>

      <h2>Changes to this policy</h2>
      <p>
        If this policy changes, the date at the top changes too. We will not start collecting data
        from your device without telling you first.
      </p>
    </LegalPage>
  );
}
