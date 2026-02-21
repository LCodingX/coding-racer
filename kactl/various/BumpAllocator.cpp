static char buf[450 << 20];
static size_t i = sizeof buf;
void* operator new(size_t s) {
    assert(s < i);
    return (void*)&buf[i -= s];
}
void operator delete(void*) {}
