import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import Reward from './models/Reward.js';
import { connectDB } from './config/db.js';

const sampleRewards = [
  {
    title: '₹50 Cash Voucher',
    description: 'Redeem for a ₹50 cash voucher at participating stores',
    pointsCost: 100,
    quantity: 50,
    image: 'https://cdn-icons-png.flaticon.com/512/2331/2331966.png'
  },
  {
    title: 'Eco-Friendly Water Bottle',
    description: 'Get a reusable stainless steel water bottle',
    pointsCost: 200,
    quantity: 30,
    image: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png'
  },
  {
    title: 'Grocery Discount - 10%',
    description: '10% discount at local grocery stores',
    pointsCost: 150,
    quantity: 100,
    image: 'https://cdn-icons-png.flaticon.com/512/3714/3714738.png'
  },
  {
    title: 'Plant a Tree Certificate',
    description: 'We will plant a tree in your name',
    pointsCost: 300,
    quantity: 200,
    image: 'https://cdn-icons-png.flaticon.com/512/628/628283.png'
  },
  {
    title: '₹100 Mobile Recharge',
    description: 'Mobile recharge voucher worth ₹100',
    pointsCost: 250,
    quantity: 40,
    image: 'https://cdn-icons-png.flaticon.com/512/6125/6125000.png'
  },
  {
    title: 'Public Transport Pass',
    description: 'Free bus/metro pass for 1 week',
    pointsCost: 500,
    quantity: 20,
    image: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png'
  }
];

const seedRewards = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    
    // Clear existing rewards
    await Reward.deleteMany({});
    console.log('Cleared existing rewards');
    
    // Insert sample rewards
    const created = await Reward.insertMany(sampleRewards);
    console.log(`Created ${created.length} rewards:`);
    created.forEach(r => {
      console.log(`  - ${r.title} (${r.pointsCost} points)`);
    });
    
    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seedRewards();
