
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const News = () => {
  // Mock news data
  const news = [
    {
      id: 1,
      title: 'New AI Integration Platform Launch',
      summary: 'Introducing our new AI integration platform that will streamline operations across all units.',
      date: 'May 15, 2023',
      category: 'Organization',
      important: true,
    },
    {
      id: 2,
      title: 'Annual Review Process Starting Next Week',
      summary: 'The annual review process will begin next week. Please prepare your documentation.',
      date: 'May 10, 2023',
      category: 'HR',
      important: false,
    },
    {
      id: 3,
      title: 'IT Maintenance Scheduled',
      summary: 'IT systems will undergo maintenance this weekend. Expect brief service interruptions.',
      date: 'May 8, 2023',
      category: 'IT',
      important: true,
    },
    {
      id: 4,
      title: 'New Security Protocols',
      summary: 'Updated security protocols will be implemented next month. Training sessions available.',
      date: 'May 5, 2023',
      category: 'Security',
      important: false,
    },
  ];

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">News & Announcements</h1>
        <p className="text-gray-500">Stay updated with the latest organizational news and unit announcements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.map((item) => (
          <Card key={item.id} className={`overflow-hidden ${item.important ? 'border-l-4 border-l-intranet-accent' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block text-xs font-medium bg-gray-100 rounded px-2 py-1 mb-2">
                    {item.category}
                  </span>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
                <span className="text-sm text-gray-500">{item.date}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{item.summary}</p>
              <button className="mt-4 text-intranet-primary hover:underline text-sm font-medium">
                Read more
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Updates</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-intranet-primary mt-2"></div>
              <div>
                <h3 className="font-medium">System Update {i + 1}.0 Released</h3>
                <p className="text-sm text-gray-500">New features and improvements are now available</p>
                <div className="text-xs text-gray-400 mt-1">May {i + 1}, 2023</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default News;
