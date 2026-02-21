typedef Point<ll> P;
typedef struct Quad* Q;
typedef __int128_t lll;
P arb(LLONG_MAX,LLONG_MAX);

struct Quad {
    Q rot, o; P pt; bool mark;
    P& F() { return r()->pt; }
    Q& r() { return rot->rot; }
    Q prev() { return rot->o->rot; }
    Q next() { return r()->prev()->r(); }
};

bool circ(P p, P a, P b, P c) {
    lll p2 = p.dist2(), A = a.dist2()-p2,
        B = b.dist2()-p2, C = c.dist2()-p2;
    return p.cross(a,b)*C + p.cross(b,c)*A + p.cross(c,a)*B > 0;
}
