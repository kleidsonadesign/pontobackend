import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// --- CONFIGURAÇÃO DE SEGURANÇA (CORS) ---
// Substitua pela URL que a Vercel te der após o deploy
const ALLOWED_ORIGIN = "https://seu-projeto-ponto.vercel.app"; 

app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// --- CONFIGURAÇÃO DE SEGURANÇA (IP) ---
// Adicione aqui os IPs autorizados (ex: IP da rede Wi-Fi da empresa)
const AUTHORIZED_IPS = ['127.0.0.1', '::1']; // Exemplo: localhost e seu IP real

const ipMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const forwarded = req.headers['x-forwarded-for'];
  // Na Render, o IP real do cliente é o primeiro da lista no x-forwarded-for
  const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

  // Verificação (Remova o 'true ||' quando souber o seu IP fixo para ativar o bloqueio)
  if (AUTHORIZED_IPS.includes(clientIp || '')) {
    next();
  } else {
    console.log(`[BLOQUEADO] Tentativa de acesso do IP: ${clientIp}`);
    return res.status(403).json({ 
      error: "Acesso negado. Este dispositivo não está na rede autorizada." 
    });
  }
};

// Aplicando o middleware de IP apenas na rota de bater ponto
// Assim o relatório pode ser visto de qualquer lugar (se você desejar)
app.use('/punch', ipMiddleware);

// --- BANCO DE DADOS TEMPORÁRIO ---
interface Entry {
  email: string;
  type: 'entrada' | 'saida';
  timestamp: Date;
  ip: string;
}

const db: Entry[] = [];

// --- ROTAS ---

// Rota para bater o ponto
app.post('/punch', (req: Request, res: Response) => {
  const { email, password, type } = req.body;
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

  if (!email || !password || !type) {
    return res.status(400).json({ error: 'Dados insuficientes.' });
  }

  const record: Entry = {
    email,
    type,
    timestamp: new Date(), // Horário imutável do servidor
    ip: String(clientIp)
  };

  db.push(record);
  res.status(201).json({ message: `Ponto de ${type} batido com sucesso!`, data: record });
});

// Rota para buscar relatório
app.get('/report/:email', (req: Request, res: Response) => {
  const { email } = req.params;
  const userHistory = db.filter(e => e.email === email);
  res.json(userHistory);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server ON na porta ${PORT}`);
  console.log(`CORS configurado para: ${ALLOWED_ORIGIN}`);
});
