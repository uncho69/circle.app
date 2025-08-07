# 🚀 Setup Supabase per Circle

## **1. Creare Progetto Supabase**

1. Vai su [supabase.com](https://supabase.com)
2. Crea un nuovo progetto
3. Scegli un nome (es: "circle-social")
4. Scegli una password forte per il database
5. Scegli una regione (es: West Europe)

## **2. Configurare Environment Variables**

Crea un file `.env.local` nella root del progetto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Dove trovare questi valori:**
- Vai su Settings → API nel dashboard Supabase
- Copia "Project URL" e "anon public" key

## **3. Eseguire Schema Database**

1. Vai su SQL Editor nel dashboard Supabase
2. Copia tutto il contenuto di `database/schema.sql`
3. Esegui lo script

## **4. Testare la Configurazione**

```bash
npm run dev
```

Dovresti vedere:
- ✅ Supabase connesso
- ✅ Database schema creato
- ✅ API funzionanti

## **5. Primi Utenti di Test**

Una volta configurato, puoi creare utenti di test:

```sql
-- Inserisci utenti di test
INSERT INTO users (wallet_address, pseudonym, display_name, bio) VALUES
('0x1234567890123456789012345678901234567890', 'testuser1', 'Test User 1', 'First test user'),
('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 'testuser2', 'Test User 2', 'Second test user');
```

## **6. Verificare Funzionamento**

1. Connetti un wallet
2. Crea un post
3. Verifica che appaia nel feed
4. Controlla che altri utenti vedano post diversi

## **🔧 Troubleshooting**

### **Errore di Connessione**
- Verifica le environment variables
- Controlla che il progetto sia attivo
- Verifica la regione del database

### **Errore di Permessi**
- Controlla le RLS policies
- Verifica che l'anon key sia corretta
- Controlla i log di Supabase

### **Errore di Schema**
- Verifica che lo script SQL sia stato eseguito completamente
- Controlla che le tabelle esistano
- Verifica gli indici e le policies

## **📊 Monitoraggio**

Nel dashboard Supabase puoi monitorare:
- **Database**: Query performance, errori
- **Auth**: Tentativi di login
- **Storage**: File uploads
- **Edge Functions**: API calls

## **🚀 Prossimi Passi**

Dopo il setup:
1. **Testare** con wallet reali
2. **Implementare** real-time subscriptions
3. **Aggiungere** autenticazione wallet-based
4. **Ottimizzare** performance
5. **Deployare** in produzione 