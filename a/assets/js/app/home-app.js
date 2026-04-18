import { fetchHomePageData } from '../services/home-service.js';
import { HomeRenderer } from '../ui/home-renderer.js';

class HomeApp {
  constructor() {
    this.renderer = new HomeRenderer(document);
  }

  async init() {
    try {
      const pageData = await fetchHomePageData();
      this.renderer.render(pageData);
    } catch (error) {
      console.error(error);
      this.renderer.renderError('Өгөгдлийг ачааллах үед алдаа гарлаа.');
    }
  }
}

const app = new HomeApp();
app.init();
