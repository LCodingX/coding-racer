ll sqrt(ll a, ll p) {
    a %= p; if (a < 0) a += p;
    if (a == 0) return 0;
    assert(modpow(a, (p-1)/2, p) == 1);
    if (p % 4 == 3) return modpow(a, (p+1)/4, p);

    ll s = p - 1, n = 2;
    int r = 0;
    while (s % 2 == 0)
        ++r, s /= 2;
    while (modpow(n, (p - 1) / 2, p) != p - 1) ++n;
    ll x = modpow(a, (s + 1) / 2, p),
       b = modpow(a, s, p), g = modpow(n, s, p);
    for (;; x = x * g % p) {
        ll t = b;
        int m = 0;
        for (; m < r && t != 1; ++m)
            t = t * t % p;
        if (m == 0) return x;
        ll gs = modpow(g, 1LL << (r - m - 1), p);
        g = gs * gs % p;
        x = x * gs % p;
        b = b * g % p;
        r = m;
    }
}
