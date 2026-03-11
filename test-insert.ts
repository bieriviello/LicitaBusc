import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data, error } = await supabase.from("editais").insert({
    numero: "123",
    orgao: "A",
    objeto: "B",
    status: "ativo"
  }).select("id");
  console.log("DATA:", data);
  console.log("ERR:", error);
}

test();
