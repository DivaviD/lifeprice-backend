const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/add-listing', async (req, res) => {
  const { title, description, category, uid } = req.body;
  try {
    const docRef = await db.collection("listings").add({
      title,
      description,
      category,
      uid,
      createdAt: new Date()
    });
    res.json({ success: true, id: docRef.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/listings', async (req, res) => {
  try {
    const snapshot = await db.collection("listings").orderBy("createdAt", "desc").get();
    const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/offer', async (req, res) => {
  const { listingId, price, uid } = req.body;
  try {
    await db.collection("offers").add({
      listingId,
      price,
      uid,
      createdAt: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/offers/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const snapshot = await db.collection("offers")
      .where("listingId", "==", id)
      .orderBy("createdAt", "desc")
      .get();
    const offers = snapshot.docs.map(doc => doc.data());
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/my-requests', async (req, res) => {
  const uid = req.query.uid;
  try {
    const snapshot = await db.collection("listings")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();
    const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});