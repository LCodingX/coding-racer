struct Frac { ll p, q; };

template<class F>
Frac fracBS(F f, ll N) {
    bool dir = 1, A = 1, B = 1;
    Frac lo{0, 1}, hi{1, 1};
    assert(f(lo)); assert(!f(hi));
    while (A || B) {
        ll adv = 0, step;
        for (step = 1; step <= (dir ? B : A); step *= 2) {
            Frac mid{lo.p + step * hi.p, lo.q + step * hi.q};
            if (abs(mid.p) > N || mid.q > N) { A = 0; break; }
            if (f(mid) == dir) adv += step;
        }
        if (dir) lo = {lo.p + adv * hi.p, lo.q + adv * hi.q};
        else hi = {adv * lo.p + hi.p, adv * lo.q + hi.q};
        dir = !dir;
    }
    return dir ? hi : lo;
}
