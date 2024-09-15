'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import styles from '../../styles/Content.module.css';
import '../../styles/global.css'; // グローバルスタイルのインポート
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';

const initialStock = Array(12).fill(10); // 在庫数の初期値

const recipes = [
  { id: 1, name: '豚骨ラーメン', imgSrc: '/images/image12.jpg', price: 300 },
  { id: 2, name: 'オードブル', imgSrc: '/images/image2.jpg', price: 500 },
  { id: 3, name: 'イタリアンオードブル', imgSrc: '/images/image3.jpg', price: 400 },
  { id: 4, name: 'ペンネ盛り合わせ', imgSrc: '/images/image10.jpg', price: 400 },
  { id: 5, name: '照り焼きチキンピザ', imgSrc: '/images/image11.jpg', price: 200 },
  { id: 6, name: '鶏モモステーキ', imgSrc: '/images/image6.jpg', price: 400 },
  { id: 7, name: '金目鯛の煮つけ', imgSrc: '/images/image7.jpg', price: 1000 },
  { id: 8, name: 'ジェノベーゼパスタ', imgSrc: '/images/image8.jpg', price: 1500 },
  { id: 9, name: '天ぷら盛り合わせ', imgSrc: '/images/image9.jpg', price: 500 },
  // 他のレシピデータ...
];

const Content = () => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stock, setStock] = useState(initialStock);

  useEffect(() => {
    if (!user) {
      router.push('/content');
    }
  }, [user, router]);

  useEffect(() => {
    const page = searchParams.get('page');
    const sessionId = searchParams.get('session_id');

    if (page === 'success') {
      console.log('Purchase was successful!', sessionId);
      alert('購入成功！');

      // 商品IDと数量を取得（サンプルとして最初のレシピのものを使用）
      const productId = recipes[0].id; // 実際には選択された商品IDを使用する
      const quantity = 1; // 必要に応じて数量を設定

      // 在庫を更新するAPIリクエストを送信
      fetch('/api/update-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'Stock updated successfully') {
          console.log('Stock updated successfully');
          // ローカルの在庫数も更新
          setStock(prevStock => {
            const newStock = [...prevStock];
            const index = recipes.findIndex(recipe => recipe.id === productId);
            if (index !== -1) {
              newStock[index] = Math.max(newStock[index] - quantity, 0);
            }
            return newStock;
          });
        } else {
          console.error('Failed to update stock:', data.error);
        }
      })
      .catch(error => {
        console.error('Error updating stock:', error);
      });
    } else if (page === 'cancel') {
      console.log('Purchase was canceled.');
      alert('購入がキャンセルされました。');
    }
  }, [searchParams]);

  const increaseStock = (index) => {
    setStock(prevStock => {
      const newStock = [...prevStock];
      newStock[index] = Math.min(newStock[index] + 1, 100);
      return newStock;
    });
  };

  const decreaseStock = (index) => {
    setStock(prevStock => {
      const newStock = [...prevStock];
      newStock[index] = Math.max(newStock[index] - 1, 0);
      return newStock;
    });
  };

  const handleAddToCart = async (recipe) => {
    const quantity = 1; // 必要に応じて数量を変更

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeId: recipe.id, price: recipe.price, quantity }),
      });
  
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
  
      const data = await res.json();
      const sessionId = data.id;
  
      const stripe = await getStripe();
  
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Error redirecting to checkout:', error);
        }
      }
    } catch (error) {
      console.error('Error handling checkout:', error);
    }
  };

  const getStripe = async () => {
    if (!window.Stripe) {
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        console.error('Stripe publishable key is not set.');
      }
  
      return stripe;
    }
  
    return window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.title}>美味しいレシピをお手軽に。</h1>
        <p className={styles.description}>
          このコンテンツでは<br />
          いろいろなアプリユーザーのレシピを購入することが可能です。<br />
          どれも有料級でパーティや行楽の参考にでもどうぞ♪
        </p>
        <div className={styles.recipesGrid}>
          {recipes.map((recipe, index) => (
            <div key={recipe.id} className={styles.recipeCard}>
              <div className={styles.imageContainer}>
                <img src={recipe.imgSrc} alt={recipe.name} className={styles.recipeImage} />
              </div>
              <div className={styles.recipeInfo}>
                <button 
                  className={styles.addToCartButton} 
                  onClick={() => handleAddToCart(recipe)}
                >
                  <FontAwesomeIcon icon={faShoppingCart} /> 購入する
                </button>
                <h3 className={styles.recipeName}>{recipe.name}</h3>
                <p className={styles.recipeNumber}>レシピ {recipe.id}</p>
                <p className={styles.price}>価格: ¥{recipe.price}</p>
                <div className={styles.stockControls}>
                  <button onClick={() => decreaseStock(index)} className={styles.stockButton}>-</button>
                  <span className={styles.stock}>在庫: {stock[index]}</span>
                  <button onClick={() => increaseStock(index)} className={styles.stockButton}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Content;
