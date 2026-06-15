import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string; // email or username
  passwordHash: string;
  salt: string;
  fullName: string;
  role: 'clinician' | 'patient' | 'analyst';
  createdAt: string;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  title: string;
  patientName: string;
  age: number;
  gender: string;
  specialty: string;
  rawText: string;
  analysis: any; // Resulting parsed object from Gemini
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  analyses: AnalysisRecord[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'clinical_db.json');

class DatabaseService {
  private db: DatabaseSchema = { users: [], analyses: [] };

  constructor() {
    this.initDb();
  }

  private initDb() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(data);
        if (!this.db.users) this.db.users = [];
        if (!this.db.analyses) this.db.analyses = [];
      } else {
        this.saveDb();
      }
    } catch (error) {
      console.error('Error initializing secure local clinical database:', error);
    }
  }

  private saveDb() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving clinical database:', error);
    }
  }

  // Auth Operations
  public registerUser(username: string, passwordPlain: string, fullName: string, role: 'clinician' | 'patient' | 'analyst' = 'clinician'): User {
    const normalizedUsername = username.trim().toLowerCase();
    const existing = this.db.users.find(u => u.username === normalizedUsername);
    if (existing) {
      throw new Error('User already exists');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(passwordPlain, salt, 1000, 64, 'sha512').toString('hex');

    const newUser: User = {
      id: crypto.randomUUID(),
      username: normalizedUsername,
      passwordHash: hash,
      salt: salt,
      fullName: fullName.trim(),
      role,
      createdAt: new Date().toISOString()
    };

    this.db.users.push(newUser);
    this.saveDb();
    return newUser;
  }

  public authenticate(username: string, passwordPlain: string): User | null {
    const normalizedUsername = username.trim().toLowerCase();
    const user = this.db.users.find(u => u.username === normalizedUsername);
    if (!user) return null;

    const hash = crypto.pbkdf2Sync(passwordPlain, user.salt, 1000, 64, 'sha512').toString('hex');
    if (user.passwordHash === hash) {
      return user;
    }
    return null;
  }

  public getUserById(id: string): User | null {
    return this.db.users.find(u => u.id === id) || null;
  }

  // Analysis History Operations
  public saveAnalysis(userId: string, record: Omit<AnalysisRecord, 'id' | 'userId' | 'createdAt'>): AnalysisRecord {
    const newRecord: AnalysisRecord = {
      ...record,
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString()
    };

    this.db.analyses.push(newRecord);
    this.saveDb();
    return newRecord;
  }

  public getAnalysesByUser(userId: string): AnalysisRecord[] {
    return this.db.analyses
      .filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAnalysisDetails(analysisId: string, userId: string): AnalysisRecord | null {
    return this.db.analyses.find(record => record.id === analysisId && record.userId === userId) || null;
  }

  public deleteAnalysis(analysisId: string, userId: string): boolean {
    const index = this.db.analyses.findIndex(record => record.id === analysisId && record.userId === userId);
    if (index !== -1) {
      this.db.analyses.splice(index, 1);
      this.saveDb();
      return true;
    }
    return false;
  }
}

export const dbService = new DatabaseService();
