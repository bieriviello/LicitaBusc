import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data: profiles, error: errp } = await supabase.from("profiles").select("*");
  console.log("PROFILES:", profiles, errp);

  const { data: roles, error: errr } = await supabase.from("user_roles").select("*");
  console.log("ROLES:", roles, errr);
}

test();
