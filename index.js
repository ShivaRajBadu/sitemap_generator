const express = require("express");
const { create } = require("xmlbuilder2");
const axios = require("axios");
const app = express();

async function generateSitemap(page) {
  const limit = 100;
  const offset = (page - 1) * limit;

  const products = await fetchProducts(limit, offset);
  if (products.length > 0) {
    const xml = create({
      urlset: {
        "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
        url: products.map((product) => ({
          loc: `https://kinu.com.np/product/${product.id}`,
        })),
      },
    });
    return xml.end({ prettyPrint: true });
  } else {
    xml = create({
      urlset: {
        "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
        url: {
          loc: "https://kinu.com.np",
        },
      },
    });
    return xml.end({
      prettyPrint: true,
    });
  }
}

app.get("/sitemap.xml", async (req, res) => {
  if (req.query.p) {
    const page = req.query.p;
    const sitemapXml = await generateSitemap(page);
    res.header("Content-Type", "application/xml");
    res.send(sitemapXml);
  } else {
    const productCount = await getProductCount();
    const numberOfSitemaps = Math.ceil(productCount / 100);

    const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${Array.from(
          { length: numberOfSitemaps },
          (_, index) =>
            `<sitemap><loc>https://kinu.com.np/sitemap.xml?p=${
              index + 1
            }</loc></sitemap>`
        ).join("\n")}
      </sitemapindex>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemapIndexXml);
  }
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

async function getProductCount() {
  try {
    const response = await axios.get(
      "https://api.kinu.app/api/product/?limit=1&offset=0"
    );
    return response.data.count || 0;
  } catch (error) {
    console.error("Error fetching product count:", error.message);
    return 0;
  }
}

async function fetchProducts(limit, offset) {
  try {
    const response = await axios.get(
      `https://api.kinu.app/api/product/?limit=${limit}&offset=${offset}`
    );
    return response.data.results || [];
  } catch (error) {
    console.error("Error fetching products:", error.message);
    return [];
  }
}
