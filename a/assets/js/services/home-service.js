import { HomePageData } from '../models/home-models.js';

export async function fetchHomePageData() {
  const response = await fetch('./assets/data/home.json');

  if (!response.ok) {
    throw new Error('Home JSON өгөгдлийг татаж авч чадсангүй.');
  }

  const raw = await response.json();
  return new HomePageData(raw);
}
