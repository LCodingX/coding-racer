typedef unsigned long long ull;
struct FastMod {
    ull b, m;
    FastMod(ull b) : b(b), m(-1ULL / b) {}
    ull reduce(ull a) {
        return a - (ull)((__uint128_t(m) * a) >> 64) * b;
    }
};
