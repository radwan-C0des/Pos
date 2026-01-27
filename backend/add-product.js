const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const product = await prisma.product.create({
      data: {
        name: 'Sunflower Oil Premium',
        sku: 'SOL-' + Date.now(),
        category: 'Beverages',
        price: 12.99,
        stock_quantity: 100,
        image_url: 'https://images.unsplash.com/photo-1536304993881-6f64995e8d58?w=500&q=80',
      },
    });
    console.log('✅ Product created successfully!');
    console.log(JSON.stringify(product, null, 2));
  } catch (error) {
    console.error('❌ Error creating product:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
