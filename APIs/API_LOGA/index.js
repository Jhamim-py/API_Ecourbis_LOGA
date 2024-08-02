const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));

app.use(express.json());

// Endpoint atualizado
app.post('/get-header-item', async (req, res) => {
    const { searchTerm } = req.body;

    const browser = await puppeteer.launch({
        headless: false, // Mude para true para produção
        args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', '--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    page.on('requestfailed', request => {
        console.log('Request failed:', request.url(), request.failure().errorText);
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console error:', msg.text());
        }
    });

    page.on('pageerror', err => {
        console.log('Page error:', err.message);
    });

    try {
        console.log('Navigating to the page...');
        await page.goto('https://sgo3.loga.com.br/consultav2/', { waitUntil: 'networkidle2' });

        console.log('Waiting for the search input...');
        await page.waitForSelector('#inputSearch', { visible: true, timeout: 60000 });

        console.log('Typing search term...');
        await page.type('#inputSearch', searchTerm);

        console.log('Pressing Enter to initiate search...');
        await page.keyboard.press('Enter');

        console.log('Waiting for the results...');
        // Ajuste o seletor para corresponder corretamente ao elemento
        await page.waitForSelector('.result-header--item.toggle-off', { visible: true, timeout: 60000 });

        console.log('Extracting header item...');
        const headerItem = await page.evaluate(() => {
            const headerElement = document.querySelector('.result-header--item.toggle-off');
            return headerElement ? headerElement.innerText.trim() : 'Nenhum item encontrado';
        });

        res.json({ headerItem });

    } catch (error) {
        console.error('Erro ao processar a página:', error.message);
        res.status(500).json({ error: 'Erro ao processar a página. ' + error.message });
    } finally {
        await browser.close();
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
