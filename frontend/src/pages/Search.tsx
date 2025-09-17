
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, Filter, FileText, Users, Calendar, Folder } from 'lucide-react';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const searchResults = [
    {
      id: 1,
      type: 'case',
      title: 'Smith vs. ABC Corporation',
      description: 'Contract dispute regarding software licensing agreement. Case involves breach of contract claims and damages.',
      date: '2024-01-15',
      status: 'Active',
      relevance: 95
    },
    {
      id: 2,
      type: 'document',
      title: 'Employment Agreement - Johnson',
      description: 'Standard employment contract template with non-compete clauses and confidentiality agreements.',
      date: '2024-01-12',
      status: 'Reviewed',
      relevance: 88
    },
    {
      id: 3,
      type: 'client',
      title: 'Michael Brown',
      description: 'Corporate client specializing in real estate transactions. Active case regarding property acquisition.',
      date: '2024-01-10',
      status: 'Active',
      relevance: 82
    },
    {
      id: 4,
      type: 'case',
      title: 'Wilson Property Acquisition',
      description: 'Real estate transaction involving commercial property purchase and due diligence review.',
      date: '2024-01-08',
      status: 'Pending',
      relevance: 78
    },
    {
      id: 5,
      type: 'document',
      title: 'Legal Precedent - Contract Law',
      description: 'Research document outlining relevant case law for breach of contract disputes in software agreements.',
      date: '2024-01-05',
      status: 'Reference',
      relevance: 75
    }
  ];

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'case': return Folder;
      case 'document': return FileText;
      case 'client': return Users;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Reviewed': return 'bg-blue-100 text-blue-800';
      case 'Reference': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResults = selectedFilter === 'all' 
    ? searchResults 
    : searchResults.filter(result => result.type === selectedFilter);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge className="mb-4 bg-legal-navy text-white">
            🔍 Advanced Search
          </Badge>
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Advanced Search
          </h1>
          <p className="text-xl text-gray-600">
            Powerful search across all cases, documents, and client information with AI-powered filters.
          </p>
        </div>

        {/* Search Interface */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cases, documents, clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="case">Cases</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-legal-navy hover:bg-legal-navy/90">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Search Results */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Search Results</CardTitle>
                  <Badge variant="secondary">
                    {filteredResults.length} results found
                  </Badge>
                </div>
                <CardDescription>
                  Results ranked by relevance and filtered by your criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredResults.map((result) => {
                    const ResultIcon = getResultIcon(result.type);
                    return (
                      <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-legal-navy rounded-lg">
                            <ResultIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">{result.title}</h3>
                              <div className="flex items-center space-x-2">
                                <Badge className={getStatusColor(result.status)}>
                                  {result.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {result.relevance}% match
                                </Badge>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{result.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>{result.date}</span>
                                <span>•</span>
                                <span className="capitalize">{result.type}</span>
                              </div>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Filters */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Content Type</h4>
                  <div className="space-y-2">
                    {['Cases', 'Documents', 'Clients', 'Templates'].map((type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Date Range</h4>
                  <div className="space-y-2">
                    {['Last 7 days', 'Last 30 days', 'Last 90 days', 'Custom'].map((range) => (
                      <label key={range} className="flex items-center space-x-2">
                        <input type="radio" name="dateRange" className="rounded" />
                        <span className="text-sm">{range}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <div className="space-y-2">
                    {['Active', 'Pending', 'Completed', 'Archived'].map((status) => (
                      <label key={status} className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Filter className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['contract disputes', 'employment law', 'real estate transactions'].map((search) => (
                    <Button key={search} variant="ghost" size="sm" className="w-full justify-start text-xs">
                      {search}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
