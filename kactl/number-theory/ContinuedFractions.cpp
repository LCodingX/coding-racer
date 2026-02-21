typedef double d;
pair<ll, ll> approximate(d x, ll N) {
    ll LP = 0, LQ = 1, P = 1, Q = 0, inf = LLONG_MAX; d y = x;
    for (;;) {
        ll lim = min(P ? (N-LP) / P : inf, Q ? (N-LQ) / Q : inf),
            a = (ll)floor(y), b = min(a, lim),
            NP = b*P + LP, NQ = b*Q + LQ;
        if (a > b) {
            return (abs(x - (d)NP / NQ) < abs(x - (d)P / Q))
                ? make_pair(NP, NQ) : make_pair(P, Q);
        }
        LP = P; P = NP;
        LQ = Q; Q = NQ;
    }
}
