const {req, res} = require('express');
const express = require('express');
const path = require('path');
const cors = require('cors');
const pdf = require('html-pdf');
const pug = require('pug');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// App settings
app.set('views', './views');
app.set('view engine', 'pug');

// Functions
const generateHash = length => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const urlify = value => {
  return value == undefined
    ? ''
    : value.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

// Routes
/* PDF API */
app.post('/api/pdf', (req, res) => {
  const body = req.body;
  const host = `${req.protocol}://${req.get('host')}`;

  console.log(Object.keys(body));

  if (!Object.keys(body).includes('name')) {
    return res.status(400).json({
      error: 'Content missing'
    });
  }

  const page = pug.renderFile('./views/pdf.pug', {year: new Date().getFullYear(), host: host, ...body});
  const fileName = `${urlify(body.name)}-${generateHash(6)}`;

  pdf.create(page, {
      childProcessOptions: {
        env: {
          OPENSSL_CONF: '/dev/null',
        },
      }
    })
    .toFile(`./public/files/${fileName}.pdf`, (error, response) => {
      if (error) {
        return res.status(400).json({
          error: 'Unable no generate PDF'
        });
      } else {
        console.log(response.filename);
        res.json({
          pdfUrl: `${host}/files/${fileName}.pdf`
        })
      }
    });

});

app.get('/page', (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  res.render('pdf', {name: 'Miles Davis', country: 'USA', topic: 'Jazz', host: host, year: new Date().getFullYear()})
})

app.get('/', (req, res) => {
  res.render('home', {date: new Date()})
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})