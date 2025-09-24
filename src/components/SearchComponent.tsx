import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Search, X, Smartphone, Laptop, Tv, Zap, HelpCircle } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  acceptedAt: string[];
  points: number;
}

interface SearchComponentProps {
  onClose: () => void;
}

const searchResults: SearchResult[] = [
  {
    id: '1',
    title: 'Smartphones & Tablets',
    description: 'Old phones, tablets, and mobile devices. Remove all personal data before disposal.',
    category: 'Mobile Devices',
    icon: <Smartphone className="w-6 h-6" />,
    acceptedAt: ['Central Electronics Recycling', 'Green Tech Drop-off'],
    points: 50,
  },
  {
    id: '2',
    title: 'Laptops & Computers',
    description: 'Desktop computers, laptops, monitors, keyboards, and mice.',
    category: 'Computing',
    icon: <Laptop className="w-6 h-6" />,
    acceptedAt: ['Central Electronics Recycling', 'University E-Waste Station'],
    points: 100,
  },
  {
    id: '3',
    title: 'TVs & Monitors',
    description: 'Televisions, computer monitors, and display screens of all sizes.',
    category: 'Displays',
    icon: <Tv className="w-6 h-6" />,
    acceptedAt: ['Central Electronics Recycling'],
    points: 75,
  },
  {
    id: '4',
    title: 'Small Appliances',
    description: 'Microwaves, toasters, coffee makers, and other small electrical appliances.',
    category: 'Appliances',
    icon: <Zap className="w-6 h-6" />,
    acceptedAt: ['Green Tech Drop-off', 'Mobile Collection Unit'],
    points: 30,
  },
];

export function SearchComponent({ onClose }: SearchComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState(searchResults);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredResults(searchResults);
    } else {
      const filtered = searchResults.filter(
        result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase()) ||
          result.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-green-600 text-white p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg">Search E-Waste Info</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for electronics, appliances..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-white text-black"
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <HelpCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try searching for "smartphone", "laptop", "tv", or "appliance"
              </p>
            </div>
          ) : (
            filteredResults.map((result) => (
              <Card key={result.id} className="border-l-4 border-l-green-600">
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <div className="text-green-600 mt-1">
                      {result.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">{result.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{result.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        +{result.points} pts
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-sm">{result.description}</p>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Accepted at:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.acceptedAt.map((location, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Find Locations
                    </Button>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Bottom Info */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-center text-sm text-muted-foreground">
            <p>Can't find what you're looking for?</p>
            <Button variant="link" className="p-0 h-auto text-green-600">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}