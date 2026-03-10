/**
 * Helper functions to synchronize and manage product stock
 */

/**
 * Deducts stock for a list of items from the Firebase Realtime Database
 * @param {Array} items - List of items in the cart (each should have id and quantity)
 * @returns {Promise} - Resolves when all stock updates are complete
 */
async function deductStock(items) {
    if (!items || !Array.isArray(items) || items.length === 0) return;

    try {
        const db = firebase.database();
        const categoriesSnap = await db.ref('categories').once('value');
        const categories = categoriesSnap.val();

        if (!categories) return;

        const updates = {};

        items.forEach(item => {
            const productId = String(item.id || item.productId);
            const quantityToDeduct = parseInt(item.quantity) || 0;

            // Find the product in the nested categories structure
            categories.forEach((category, catIndex) => {
                if (category && category.products) {
                    // Support both array and object for products
                    if (Array.isArray(category.products)) {
                        const prodIndex = category.products.findIndex(p => p && String(p.id) === productId);
                        if (prodIndex !== -1) {
                            const currentStock = parseInt(category.products[prodIndex].stock) || 0;
                            const newStock = Math.max(0, currentStock - quantityToDeduct);
                            updates[`categories/${catIndex}/products/${prodIndex}/stock`] = newStock;

                            // Increment sold count by the same amount deducted from stock
                            const currentSold = parseInt(category.products[prodIndex].sold) || 0;
                            const newSold = currentSold + quantityToDeduct;
                            updates[`categories/${catIndex}/products/${prodIndex}/sold`] = Math.max(currentSold, newSold);
                        }
                    } else {
                        // Handle object format products
                        Object.entries(category.products).forEach(([pKey, pVal]) => {
                            if (pVal && String(pVal.id || pKey) === productId) {
                                const currentStock = parseInt(pVal.stock) || 0;
                                const newStock = Math.max(0, currentStock - quantityToDeduct);
                                updates[`categories/${catIndex}/products/${pKey}/stock`] = newStock;

                                // Increment sold count by the same amount deducted from stock
                                const currentSold = parseInt(pVal.sold) || 0;
                                const newSold = currentSold + quantityToDeduct;
                                updates[`categories/${catIndex}/products/${pKey}/sold`] = Math.max(currentSold, newSold);
                            }
                        });
                    }
                }
            });
        });

        if (Object.keys(updates).length > 0) {
            await db.ref().update(updates);
            console.log('Stock deducted and Sold count increased successfully:', updates);
        }
    } catch (error) {
        console.error('Error deducting stock:', error);
    }
}

/**
 * Increments (or decrements) sold count for products
 * @param {Array} items - List of items
 * @param {number} delta - Amount to change (usually 1, can be negative to undo)
 */
async function incrementSold(items, delta = 1) {
    if (!items || !Array.isArray(items) || items.length === 0) return;

    try {
        const db = firebase.database();
        const categoriesSnap = await db.ref('categories').once('value');
        const categories = categoriesSnap.val();

        if (!categories) return;

        const updates = {};

        items.forEach(item => {
            const productId = String(item.id || item.productId);
            const quantityPurchased = parseInt(item.quantity) || 0;
            const finalDelta = quantityPurchased * delta;

            categories.forEach((category, catIndex) => {
                if (category && category.products) {
                    if (Array.isArray(category.products)) {
                        const prodIndex = category.products.findIndex(p => p && String(p.id) === productId);
                        if (prodIndex !== -1) {
                            const currentSold = parseInt(category.products[prodIndex].sold) || 0;
                            const newSold = currentSold + finalDelta;
                            // "Không bao giờ giảm đi" - Ensure the new value is at least the current value
                            updates[`categories/${catIndex}/products/${prodIndex}/sold`] = Math.max(currentSold, newSold);
                        }
                    } else {
                        Object.entries(category.products).forEach(([pKey, pVal]) => {
                            if (pVal && String(pVal.id || pKey) === productId) {
                                const currentSold = parseInt(pVal.sold) || 0;
                                const newSold = currentSold + finalDelta;
                                updates[`categories/${catIndex}/products/${pKey}/sold`] = Math.max(currentSold, newSold);
                            }
                        });
                    }
                }
            });
        });

        if (Object.keys(updates).length > 0) {
            await db.ref().update(updates);
            console.log('Sold count updated:', updates);
        }
    } catch (error) {
        console.error('Error updating sold count:', error);
    }
}
