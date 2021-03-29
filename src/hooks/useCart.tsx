import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

interface ApiAmount {
  id: number;
  amount: number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    
    return [];
  });
  
  const addProduct = async (productId: number) => {
    try {
      // TODO  
      const response = await api.get<ApiAmount>(`stock/${productId}`);
      const {amount} = response.data;
      
      if(cart.length > 0) {
        const selectedProduct = cart.find(product => product.id === productId);
        
        if(selectedProduct) {
          const selectedProductId = cart.findIndex(product => product.id === productId);
          
          if(selectedProduct.amount < amount) {
            // Atualizar a variável cart;
            // Atualizar o valor do @RocketShoes:cart
            const updatedCart = cart.map((product, index) => {
              if(index === selectedProductId) {
                product.amount += 1;
              }
              return product;
            });
            
            setCart(updatedCart);
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        } else {
          const response = await api.get<Product>(`products/${productId}`);
          const product = response.data;
          setCart([...cart, {...product, amount: 1}]);
        }
      } else {
        const response = await api.get<Product>(`products/${productId}`);
        const product = response.data;
        setCart([{...product, amount: 1}]);
      }
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };
  
  const removeProduct = (productId: number) => {
    try {
      // TODO
      const updatedCart = cart.filter(product => product.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };
  
  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const response = await api.get<ApiAmount>(`stock/${productId}`);
      const {amount: amountAvaliable} = response.data;
      const selectedProduct = cart.find(product => product.id === productId);
      
      if(selectedProduct) {
        if(selectedProduct.amount === 0) {
          return false;
        }

        if(selectedProduct.amount < amountAvaliable || Math.sign(amount) === -1) {
          const updatedCart = cart.map(product => {
            if(product.id === productId) {
              product.amount += (amount);
            }
            return product;
          }).filter(product => product.amount !== 0);

          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };
  
  return (
    <CartContext.Provider
    value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
    {children}
    </CartContext.Provider>
    );
  }
  
  export function useCart(): CartContextData {
    const context = useContext(CartContext);
    
    return context;
  }
  