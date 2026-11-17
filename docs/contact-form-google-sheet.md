# Contact form → Google Sheet

The Contact page form posts to a Google Apps Script web app that appends each message as a row in a Google Sheet.

## Set it up (about 5 minutes)

1. Create a new Google Sheet, for example "APL Analytics – Contact responses".
2. In the sheet: **Extensions → Apps Script**. Delete what is there and paste the script below. Save.
3. Click **Deploy → New deployment**. Type: **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, allow the permissions, and copy the **Web app URL** (it ends in `/exec`).
5. Put that URL in `FORM_URL` at the top of the Contact section in `js/pages/about.js`, then redeploy the site.

Until `FORM_URL` is set, the form opens the visitor's email app with the message filled in.

## Script

```js
const HEADERS = ['Received', 'Name', 'Email', 'Topic', 'Match / set / arrow', 'Message', 'Page'];

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  const p = e.parameter || {};
  const clip = (v, n) => String(v || '').slice(0, n);
  sheet.appendRow([new Date(), clip(p.name, 80), clip(p.email, 120), clip(p.topic, 60), clip(p.match, 120), clip(p.message, 3000), clip(p.page, 200)]);
  return ContentService.createTextOutput('ok');
}
```

Optional: to get an email for each new message, add `MailApp.sendEmail('you@example.com', 'New APL Analytics message', p.message);` inside `doPost` and redeploy (Deploy → Manage deployments → edit → new version).
