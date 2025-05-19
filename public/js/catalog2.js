function handleScroll() {
    if (isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - 500) {
        loadProducts(currentPage + 1);
    }
}  





window.addEventListener('scroll', handleScroll); 


