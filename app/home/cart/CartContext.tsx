"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export interface Product {
    id: number;
    _id?: string;
    name: string;
    price: number;
    qty: number;
    image?: string;
    desc?: string;
    stock?: number;
    label?: string;
}

interface CartContextProps {
    cart: Product[];
    addToCart: (product: Product) => void;
    removeFromCart: (id: number | string) => void;
    increaseQty: (id: number | string) => void;
    decreaseQty: (id: number | string) => void;
    clearCart: () => void;
    getTotalQty: () => number;
}

const CartContext = createContext<CartContextProps>({
    cart: [],
    addToCart: () => { },
    removeFromCart: () => { },
    increaseQty: () => { },
    decreaseQty: () => { },
    clearCart: () => { },
    getTotalQty: () => 0,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<Product[]>([]);

    // Tải giỏ hàng từ localStorage khi component được mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }
        } catch (error) {
            console.error('Lỗi khi tải giỏ hàng từ localStorage:', error);
        }
    }, []);

    // Lưu giỏ hàng vào localStorage mỗi khi nó thay đổi
    useEffect(() => {
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
        } catch (error) {
            console.error('Lỗi khi lưu giỏ hàng vào localStorage:', error);
        }
    }, [cart]);

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const productInCart = prevCart.find(item =>
                (item.id === product.id) || (item._id && item._id === product._id)
            );

            if (productInCart) {
                return prevCart.map(item =>
                    (item.id === product.id) || (item._id && item._id === product._id)
                        ? { ...item, qty: item.qty + 1 }
                        : item
                );
            } else {
                return [...prevCart, { ...product, qty: 1 }];
            }
        });
    };

    const removeFromCart = (id: number | string) => {
        setCart(prevCart => prevCart.filter(item =>
            item.id !== id && (item._id ? item._id !== id : true)
        ));
    };

    const increaseQty = (id: number | string) => {
        setCart(prevCart =>
            prevCart.map(item =>
                (item.id === id) || (item._id && item._id === id)
                    ? { ...item, qty: item.qty + 1 }
                    : item
            )
        );
    };

    const decreaseQty = (id: number | string) => {
        setCart(prevCart => {
            const item = prevCart.find(item =>
                (item.id === id) || (item._id && item._id === id)
            );

            if (item && item.qty === 1) {
                return prevCart.filter(item =>
                    item.id !== id && (item._id ? item._id !== id : true)
                );
            }

            return prevCart.map(item =>
                (item.id === id) || (item._id && item._id === id)
                    ? { ...item, qty: item.qty - 1 }
                    : item
            );
        });
    };

    const clearCart = () => {
        setCart([]);
    };

    const getTotalQty = () => {
        return cart.reduce((total, item) => total + item.qty, 0);
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                increaseQty,
                decreaseQty,
                clearCart,
                getTotalQty,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext); 