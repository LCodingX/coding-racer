struct AhoCorasick {
    enum {alpha = 26, first = 'a'};
    struct Node {

        int back, next[alpha], start = -1, end = -1, nmatches = 0;
        Node(int v) { memset(next, v, sizeof(next)); }
    };
    vector<Node> N;
    vi backp;

    void insert(string& s, int j) {
        int n = 0;
        for (char c : s) {
            int& m = N[n].next[c - first];
            if (m == -1) { m = sz(N); N.emplace_back(-1); }
            n = m;
        }
        if (N[n].end == -1) N[n].start = j;
        backp.push_back(N[n].end);
        N[n].end = j;
        N[n].nmatches++;
    }

    AhoCorasick(vector<string>& pat) : N(1, -1) {
        rep(i,0,sz(pat)) insert(pat[i], i);

        queue<int> q;
        q.push(0);
        while (!q.empty()) {
            int n = q.front(); q.pop();
            int prev = N[n].back;
            rep(i,0,alpha) {
                int &ed = N[n].next[i], y = prev < 0 ? 0 : N[prev].next[i];
                if (ed == -1) ed = y;
                else {
                    N[ed].back = n ? y : 0;
                    N[ed].nmatches += N[y].nmatches;
                    q.push(ed);
                }
            }
        }
    }

    vi find(string& word) {
        vi res;
        int n = 0;
        for (char c : word) {
            n = N[n].next[c - first];

            res.push_back(N[n].end);
        }
        return res;
    }

    vector<vi> findAll(vector<string>& pat, string& word) {
        vi r = find(word);
        vector<vi> res(sz(word));
        rep(i,0,sz(word)) {
            int ind = r[i];
            while (ind != -1) {
                res[i - sz(pat[ind]) + 1].push_back(ind);
                ind = backp[ind];
            }
        }
        return res;
    }
};
