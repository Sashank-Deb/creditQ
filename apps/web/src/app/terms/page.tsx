import type { Metadata } from 'next';
import LegalPage from '@/features/legal/LegalPage';

export const metadata: Metadata = { title: 'Terms and conditions · CreditQ' };

export default function Page() {
  return (
    <LegalPage title="Terms and conditions" updated="8 November 2026">
      <p>By using CreditQ you agree to these terms. They are written to be read, so please do.</p>

      <h2>What CreditQ is</h2>
      <p>
        CreditQ is a free reminder tool. You enter your cards and their dates, and it tells you when
        to pay. It is not a bank, a payment app or a financial adviser. It cannot make payments for
        you and it never touches your money.
      </p>

      <h2>You stay responsible for paying on time</h2>
      <p>
        Reminders can fail. Phones go silent, notifications can be blocked, batteries die, and
        calendars can be misconfigured. Dates are only as correct as what you enter, and holiday
        rules used for pay days are a best effort. Always check your bank statement or bank app for
        the real due date and amount. CreditQ is not responsible for late fees, interest, credit
        score changes or any other loss from a missed or late payment.
      </p>

      <h2>Your data</h2>
      <p>
        Your information lives on your device (see the privacy policy). That also means we cannot
        restore it. Clearing browser data, uninstalling, switching phones or using the delete button
        removes it. Use Export to keep a backup, and keep the passphrase safe.
      </p>

      <h2>Using the app</h2>
      <ul>
        <li>Do not try to break, reverse-engineer for harm, or overload the service.</li>
        <li>
          Do not enter full card numbers, CVVs, PINs or passwords. The app is not built for them.
        </li>
        <li>
          Bank and card names you enter are your own labels. CreditQ is not affiliated with or
          endorsed by any bank.
        </li>
      </ul>

      <h2>No warranty</h2>
      <p>
        CreditQ is provided &ldquo;as is&rdquo;, without promises that it will be error-free, always
        available or fit for a particular purpose. To the extent the law allows, the makers are not
        liable for indirect or consequential loss, and our total liability is limited to what you
        paid for the app, which is nothing.
      </p>

      <h2>Changes and ending</h2>
      <p>
        We may change the app or these terms. The date at the top shows the latest version.
        Continuing to use the app after a change means you accept it. You can stop using CreditQ at
        any time and delete your data from Settings.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India.</p>
    </LegalPage>
  );
}
