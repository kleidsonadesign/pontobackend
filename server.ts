// server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Interface Simples (Substitua por um Banco de Dados como MongoDB em produção)
interface Entry {
  email: string;
  type: 'entrada' | 'saida';
  timestamp: Date;
  ip: string;
}

const db: Entry[] = [];

// Rota de Registro de Ponto
app.post('/punch', (req: Request, res: Response) => {
  const { email, password, type } = req.body;
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Validação simples (em prod, use bcrypt para verificar senha)
  if (!email || !password) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const record: Entry = {
    email,
    type,
    timestamp: new Date(), // Horário oficial do servidor
    ip: String(userIp)
  };

  db.push(record);
  res.status(201).json({ message: `Ponto de ${type} registrado!`, data: record });
});

// Rota de Relatório
app.get('/report/:email', (req: Request, res: Response) => {
  const { email } = req.params;
  const report = db.filter(e => e.email === email);
  res.json(report);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));