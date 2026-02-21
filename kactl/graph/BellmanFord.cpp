const ll inf = LLONG_MAX;
struct Ed { int a, b, w, s; };
struct Node { ll dist = inf; int prev = -1; };

void bellmanFord(vector<Node>& nodes, vector<Ed>& eds, int s) {
    nodes[s].dist = 0;
    sort(all(eds), [](Ed a, Ed b) { return a.s < b.s; });

    int lim = sz(nodes) / 2 + 2;
    rep(i,0,lim) for (Ed e : eds) {
        Node cur = nodes[e.a], &dest = nodes[e.b];
        if (abs(cur.dist) == inf) continue;
        ll d = cur.dist + e.w;
        if (d < dest.dist) {
            dest.prev = e.a;
            dest.dist = (i < lim-1 ? d : -inf);
        }
    }
    rep(i,0,lim) for (Ed e : eds) {
        if (nodes[e.a].dist == -inf)
            nodes[e.b].dist = -inf;
    }
}
