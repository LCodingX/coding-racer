import path from 'path'
import fs from 'fs'
import { app, ipcMain, BrowserWindow, Menu } from 'electron'
import serve from 'electron-serve'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

function getTemplatesDir(): string {
  const dir = path.join(app.getPath('userData'), 'templates')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

function getDataPath(): string {
  return path.join(app.getPath('userData'), 'fsrs-data.json')
}

function getPracticeHistoryPath(): string {
  return path.join(app.getPath('userData'), 'practice-history.json')
}

function readPracticeHistory(): Record<string, any[]> {
  const histPath = getPracticeHistoryPath()
  if (!fs.existsSync(histPath)) {
    return {}
  }
  try {
    return JSON.parse(fs.readFileSync(histPath, 'utf-8'))
  } catch {
    return {}
  }
}

function writePracticeHistory(data: Record<string, any[]>): void {
  fs.writeFileSync(getPracticeHistoryPath(), JSON.stringify(data, null, 2), 'utf-8')
}

function readFsrsData(): Record<string, any> {
  const dataPath = getDataPath()
  if (!fs.existsSync(dataPath)) {
    return {}
  }
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  } catch {
    return {}
  }
}

function writeFsrsData(data: Record<string, any>): void {
  fs.writeFileSync(getDataPath(), JSON.stringify(data, null, 2), 'utf-8')
}

function seedDefaultTemplates(): void {
  const templatesDir = getTemplatesDir()
  const existing = fs.readdirSync(templatesDir)
  if (existing.length > 0) return

  const defaults: Record<string, string> = {
    'kactl-dsu.cpp': `struct DSU {
\tvector<int> p, rank_;
\tDSU(int n) : p(n), rank_(n, 0) {
\t\tiota(p.begin(), p.end(), 0);
\t}
\tint find(int x) {
\t\treturn p[x] == x ? x : p[x] = find(p[x]);
\t}
\tbool unite(int a, int b) {
\t\ta = find(a); b = find(b);
\t\tif (a == b) return false;
\t\tif (rank_[a] < rank_[b]) swap(a, b);
\t\tp[b] = a;
\t\tif (rank_[a] == rank_[b]) rank_[a]++;
\t\treturn true;
\t}
};`,
    'kactl-segtree.cpp': `struct SegTree {
\tint n;
\tvector<ll> t;
\tSegTree(int n) : n(n), t(2 * n, 0) {}
\tvoid update(int i, ll val) {
\t\tfor (t[i += n] = val; i > 1; i >>= 1)
\t\t\tt[i >> 1] = t[i] + t[i ^ 1];
\t}
\tll query(int l, int r) {
\t\tll res = 0;
\t\tfor (l += n, r += n + 1; l < r; l >>= 1, r >>= 1) {
\t\t\tif (l & 1) res += t[l++];
\t\t\tif (r & 1) res += t[--r];
\t\t}
\t\treturn res;
\t}
};`,
    'kactl-sieve.cpp': `vector<int> sieve(int n) {
\tvector<bool> is_prime(n + 1, true);
\tvector<int> primes;
\tis_prime[0] = is_prime[1] = false;
\tfor (int i = 2; i <= n; i++) {
\t\tif (is_prime[i]) {
\t\t\tprimes.push_back(i);
\t\t\tfor (ll j = (ll)i * i; j <= n; j += i)
\t\t\t\tis_prime[j] = false;
\t\t}
\t}
\treturn primes;
}`,
    'kactl-dijkstra.cpp': `typedef pair<ll, int> pli;
vector<ll> dijkstra(int s, vector<vector<pli>>& adj) {
\tint n = adj.size();
\tvector<ll> dist(n, LLONG_MAX);
\tpriority_queue<pli, vector<pli>, greater<pli>> pq;
\tdist[s] = 0;
\tpq.push({0, s});
\twhile (!pq.empty()) {
\t\tauto [d, u] = pq.top(); pq.pop();
\t\tif (d > dist[u]) continue;
\t\tfor (auto [w, v] : adj[u]) {
\t\t\tif (dist[u] + w < dist[v]) {
\t\t\t\tdist[v] = dist[u] + w;
\t\t\t\tpq.push({dist[v], v});
\t\t\t}
\t\t}
\t}
\treturn dist;
}`,
    'kactl-modpow.cpp': `ll mod_pow(ll base, ll exp, ll mod) {
\tll result = 1;
\tbase %= mod;
\twhile (exp > 0) {
\t\tif (exp & 1) result = result * base % mod;
\t\tbase = base * base % mod;
\t\texp >>= 1;
\t}
\treturn result;
}

ll mod_inv(ll a, ll mod) {
\treturn mod_pow(a, mod - 2, mod);
}

const ll MOD = 998244353;

vector<ll> fact, inv_fact;
void precompute(int n) {
\tfact.resize(n + 1);
\tinv_fact.resize(n + 1);
\tfact[0] = 1;
\tfor (int i = 1; i <= n; i++)
\t\tfact[i] = fact[i - 1] * i % MOD;
\tinv_fact[n] = mod_inv(fact[n], MOD);
\tfor (int i = n - 1; i >= 0; i--)
\t\tinv_fact[i] = inv_fact[i + 1] * (i + 1) % MOD;
}

ll C(int n, int k) {
\tif (k < 0 || k > n) return 0;
\treturn fact[n] % MOD * inv_fact[k] % MOD * inv_fact[n - k] % MOD;
}`,
  }

  for (const [filename, content] of Object.entries(defaults)) {
    fs.writeFileSync(path.join(templatesDir, filename), content, 'utf-8')
  }
}

let mainWindow: BrowserWindow | null = null

function getTemplateFiles(): string[] {
  const dir = getTemplatesDir()
  return fs.readdirSync(dir).sort()
}

function rebuildMenu(): void {
  if (!mainWindow) return

  const templates = getTemplateFiles()

  const templateSubmenu: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Add Template',
      click: () => {
        mainWindow!.webContents.send('menu-action', { action: 'add-template' })
      },
    },
  ]

  if (templates.length > 0) {
    templateSubmenu.push({ type: 'separator' })
    for (const filename of templates) {
      templateSubmenu.push({
        label: filename,
        submenu: [
          {
            label: 'Edit',
            click: () => {
              mainWindow!.webContents.send('menu-action', { action: 'edit-template', templateId: filename })
            },
          },
          {
            label: 'Remove',
            click: () => {
              mainWindow!.webContents.send('menu-action', { action: 'remove-template', templateId: filename })
            },
          },
        ],
      })
    }
  }

  const racingSubmenu: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Random Race',
      enabled: templates.length > 0,
      click: () => {
        mainWindow!.webContents.send('menu-action', { action: 'random-race' })
      },
    },
  ]

  if (templates.length > 0) {
    racingSubmenu.push({ type: 'separator' })
    for (const filename of templates) {
      racingSubmenu.push({
        label: filename,
        click: () => {
          mainWindow!.webContents.send('menu-action', { action: 'race-template', templateId: filename })
        },
      })
    }
  }

  const menu = Menu.buildFromTemplate([
    {
      label: 'Templates',
      submenu: templateSubmenu,
    },
    {
      label: 'Racing',
      submenu: racingSubmenu,
    },
  ])

  Menu.setApplicationMenu(menu)
}

;(async () => {
  await app.whenReady()

  seedDefaultTemplates()

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  rebuildMenu()

  if (isProd) {
    await mainWindow.loadURL('app://./index.html')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/`)
    mainWindow.webContents.openDevTools()
  }

  // --- IPC Handlers ---

  ipcMain.handle('get-templates', async () => {
    const dir = getTemplatesDir()
    const files = fs.readdirSync(dir)
    return files.map((filename) => {
      const content = fs.readFileSync(path.join(dir, filename), 'utf-8')
      return { id: filename, filename, content }
    })
  })

  ipcMain.handle('get-template', async (_event, id: string) => {
    const filepath = path.join(getTemplatesDir(), id)
    if (!fs.existsSync(filepath)) return null
    const content = fs.readFileSync(filepath, 'utf-8')
    return { id, filename: id, content }
  })

  ipcMain.handle('save-template', async (_event, id: string, content: string) => {
    const sanitized = path.basename(id)
    fs.writeFileSync(path.join(getTemplatesDir(), sanitized), content, 'utf-8')
    rebuildMenu()
    return { id: sanitized, filename: sanitized, content }
  })

  ipcMain.handle('delete-template', async (_event, id: string) => {
    const filepath = path.join(getTemplatesDir(), path.basename(id))
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
    // Also remove FSRS data
    const data = readFsrsData()
    delete data[id]
    writeFsrsData(data)
    // Also remove practice history
    const history = readPracticeHistory()
    delete history[id]
    writePracticeHistory(history)
    rebuildMenu()
    return true
  })

  ipcMain.handle('get-fsrs-data', async () => {
    return readFsrsData()
  })

  ipcMain.handle('get-fsrs-card', async (_event, id: string) => {
    const data = readFsrsData()
    return data[id] || null
  })

  ipcMain.handle('save-fsrs-card', async (_event, id: string, card: any) => {
    const data = readFsrsData()
    data[id] = card
    writeFsrsData(data)
    return true
  })

  ipcMain.handle('get-practice-history', async (_event, id: string) => {
    const history = readPracticeHistory()
    return history[id] || []
  })

  ipcMain.handle('save-practice-attempt', async (_event, id: string, attempt: any) => {
    const history = readPracticeHistory()
    if (!history[id]) {
      history[id] = []
    }
    history[id].push(attempt)
    writePracticeHistory(history)
    return true
  })

  ipcMain.handle('get-all-practice-history', async () => {
    return readPracticeHistory()
  })

  ipcMain.handle('set-window-title', async (_event, title: string) => {
    if (mainWindow) {
      mainWindow.setTitle(title)
    }
    return true
  })
})()
