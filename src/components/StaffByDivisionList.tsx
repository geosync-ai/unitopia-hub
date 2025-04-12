import React, { useState } from 'react';
import useStaffByDivision from '@/hooks/useStaffByDivision';
import { Input, Select, Spinner, Box, Heading, Text, VStack, HStack, Avatar, Flex, Badge } from '@chakra-ui/react';
import { useDivisionContext } from '@/hooks/useDivisionContext';

interface StaffByDivisionListProps {
  initialDivisionId?: string;
}

export const StaffByDivisionList: React.FC<StaffByDivisionListProps> = ({ initialDivisionId }) => {
  const { userDivisions } = useDivisionContext();
  const [divisionId, setDivisionId] = useState<string | undefined>(initialDivisionId);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeAllDivisions, setIncludeAllDivisions] = useState(false);

  const { staffMembers, loading, error, isEmpty } = useStaffByDivision({
    divisionId,
    searchQuery,
    includeAllDivisions,
  });

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDivisionId(value === 'all' ? undefined : value);
    setIncludeAllDivisions(value === 'all');
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
      <Heading size="md" mb={4}>Staff Directory</Heading>
      
      <VStack spacing={4} align="stretch" mb={6}>
        <HStack>
          <Select 
            placeholder="Select Division" 
            value={divisionId || (includeAllDivisions ? 'all' : '')}
            onChange={handleDivisionChange}
          >
            <option value="all">All Divisions</option>
            {userDivisions.map(division => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </Select>
          
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </HStack>
      </VStack>

      {loading ? (
        <Flex justify="center" my={8}>
          <Spinner size="xl" />
        </Flex>
      ) : error ? (
        <Text color="red.500" textAlign="center">{error}</Text>
      ) : isEmpty ? (
        <Text textAlign="center">No staff members found</Text>
      ) : (
        <VStack spacing={3} align="stretch">
          {staffMembers.map(staff => (
            <Box 
              key={staff.email} 
              p={3} 
              borderWidth="1px" 
              borderRadius="md"
              _hover={{ bg: 'gray.50' }}
            >
              <HStack spacing={4}>
                <Avatar name={staff.name} size="md" />
                <VStack align="start" spacing={1} flex={1}>
                  <Heading size="sm">{staff.name}</Heading>
                  <Text fontSize="sm" color="gray.600">{staff.job_title}</Text>
                  <Text fontSize="sm">{staff.email}</Text>
                  <HStack>
                    <Badge colorScheme="blue">{staff.department}</Badge>
                    {staff.division && (
                      <Badge colorScheme="purple">{staff.division}</Badge>
                    )}
                  </HStack>
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default StaffByDivisionList; 