import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../lib/db';
import { users, documents, documentShares } from '../lib/schema';
import { hashPassword } from '../lib/auth';

const DEMO_PASSWORD = 'demo';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const alice = await db
    .insert(users)
    .values({
      email: 'alice@demo.com',
      name: 'Alice',
      passwordHash: hashPassword(DEMO_PASSWORD),
    })
    .returning()
    .then((rows) => rows[0]);

  const bob = await db
    .insert(users)
    .values({
      email: 'bob@demo.com',
      name: 'Bob',
      passwordHash: hashPassword(DEMO_PASSWORD),
    })
    .returning()
    .then((rows) => rows[0]);

  const carol = await db
    .insert(users)
    .values({
      email: 'carol@demo.com',
      name: 'Carol',
      passwordHash: hashPassword(DEMO_PASSWORD),
    })
    .returning()
    .then((rows) => rows[0]);

  console.log('✅ Created users: alice@demo.com, bob@demo.com, carol@demo.com');

  // Create a sample document owned by Alice
  const doc = await db
    .insert(documents)
    .values({
      ownerId: alice.id,
      title: 'Welcome to Ajaia',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Welcome to Ajaia' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This is a shared demo document. Try editing it!',
              },
            ],
          },
        ],
      },
    })
    .returning()
    .then((rows) => rows[0]);

  console.log('✅ Created sample document: "Welcome to Ajaia"');

  // Share the document with Bob as editor
  await db.insert(documentShares).values({
    documentId: doc.id,
    userId: bob.id,
    role: 'editor',
  });

  // Share the document with Carol as viewer
  await db.insert(documentShares).values({
    documentId: doc.id,
    userId: carol.id,
    role: 'viewer',
  });

  console.log('✅ Shared document with Bob (editor) and Carol (viewer)');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: alice@demo.com (owner of sample doc)');
  console.log('   Email: bob@demo.com (editor on sample doc)');
  console.log('   Email: carol@demo.com (viewer on sample doc)');
  console.log('   Password: demo');
  console.log('\n✨ Seed complete!');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
