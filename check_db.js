import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPriceColumn() {
  const { data, error } = await supabase.from('Classes').select('price').limit(1);
  
  if (error) {
    console.error(error.message);
  } else {
    console.log("Column 'price' exists! Data:", data);
  }
}

checkPriceColumn();
