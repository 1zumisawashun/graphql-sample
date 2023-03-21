import { NextPage } from 'next';

import Layout from '@/components/common/Layout';

const Home: NextPage = () => {
  return (
    <Layout path="/" title="タイトル" noTitleTemplate isTopPage>
      <p>index.tsx</p>
    </Layout>
  );
};

export default Home;
