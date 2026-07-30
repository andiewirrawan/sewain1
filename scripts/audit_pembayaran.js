
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runAudit() {
    console.log("--- START AUDIT ---");
    
    const { data, error } = await supabase
        .from('alokasi_pembayaran')
        .select('id_tagihan, tagihan(id_kontrak, kontrak_sewa(id_penyewa, id_unit))')
        .eq('id_pembayaran', 'cd5b1681-6384-402c-8e48-9f085c3659be');

    if (error) {
        console.log("Error querying alokasi_pembayaran:", error);
        return;
    }
    console.log("Alokasi found:", JSON.stringify(data, null, 2));
}
runAudit();
