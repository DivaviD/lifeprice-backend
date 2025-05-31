
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

// Читаем ключ из переменной окружения
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
// ➕ Добавление нового запроса
app.post('/add-listing', async (req, res) => {
  try {
    const listing = {
      ...req.body,
      uid: req.headers['uid'] || null,
      createdAt: new Date(),
    };
    const docRef = await db.collection('listings').add(listing);
    res.json({ success: true, id: docRef.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📄 Получение всех запросов
app.get('/listings', async (req, res) => {
  try {
    const snapshot = await db.collection('listings').orderBy('createdAt', 'desc').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 💬 Предложение цены
app.post('/offer', async (req, res) => {
  const { listingId, price } = req.body;
  try {
    await db.collection('offers').add({
      listingId,
      price,
      createdAt: new Date(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📦 Предложения по конкретному запросу
app.get('/offers/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const snapshot = await db.collection('offers')
      .where('listingId', '==', id)
      .orderBy('createdAt', 'desc')
      .get();
    const offers = snapshot.docs.map(doc => doc.data());
    res.json(offers);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 👤 Запросы текущего пользователя
app.get('/my-requests', async (req, res) => {
  const uid = req.query.uid;
  try {
    const snapshot = await db.collection('listings')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(listings);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});
