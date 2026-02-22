import express from 'express';
import { getCV, saveCV } from '../utils/database.js';
import { parseCV } from '../utils/cvParser.js';

const router = express.Router();

// Get uploaded CV
router.get('/', (req, res) => {
  try {
    const cv = getCV();
    res.json(cv || { message: 'No CV uploaded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Parse and save CV from text
router.post('/parse', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No CV text provided' });
    }
    
    const parsedCV = parseCV(text);
    const savedCV = saveCV(parsedCV);
    
    res.json({
      message: 'CV parsed and saved successfully',
      cv: savedCV,
      parsed: parsedCV
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save CV manually
router.post('/', (req, res) => {
  try {
    const cvData = req.body;
    const savedCV = saveCV(cvData);
    res.status(201).json(savedCV);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update CV
router.put('/', (req, res) => {
  try {
    const cvData = req.body;
    const savedCV = saveCV(cvData);
    res.json(savedCV);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;