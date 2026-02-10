import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const connection = app.get<Connection>(getConnectionToken());

  try {
    // Drop all collections
    const collections = await connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`✅ Cleared collection: ${collection.collectionName}`);
    }

    console.log('\n✨ Database cleared successfully!\n');
    console.log('💡 Run "npm run seed" to populate with test data.\n');

  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  } finally {
    await app.close();
  }
}

clearDatabase();
