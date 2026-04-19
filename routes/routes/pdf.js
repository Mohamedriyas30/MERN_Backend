const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

// GET PDF
router.get('/certificate/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // important for deployment
    });

    const page = await browser.newPage();

    const html = `
      <html>
        <body style="text-align:center; font-family:sans-serif;">
          <h1>Certificate of Completion</h1>
          <p>This is to certify that</p>
          <h2>${name}</h2>
          <p>has successfully completed the course</p>
        </body>
      </html>
    `;

    await page.setContent(html);

    const pdf = await page.pdf({ format: 'A4' });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=certificate.pdf'
    });

    res.send(pdf);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;