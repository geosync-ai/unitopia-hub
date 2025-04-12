interface StaffMember {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  divisionId: string;
}

// Staff organized by division
const staffByDivision: Record<string, StaffMember[]> = {
  'executive-division': [
    {
      id: "1",
      name: "Andy Ambulu",
      email: "aambulu@scpng.gov.pg",
      jobTitle: "General Counsel",
      department: "Secretariat Unit",
      divisionId: "executive-division"
    },
    {
      id: "9",
      name: "James Joshua",
      email: "jjoshua@scpng.gov.pg",
      jobTitle: "Acting Chief Executive Officer",
      department: "Executive Division",
      divisionId: "executive-division"
    },
    {
      id: "25",
      name: "Robert Salmon Minak",
      email: "rminak@scpng.gov.pg",
      jobTitle: "Acting Executive Chairman",
      department: "Executive Unit",
      divisionId: "executive-division"
    }
  ],
  'corporate-services-division': [
    {
      id: "2",
      name: "Anita Kosnga",
      email: "akosnga@scpng.gov.pg",
      jobTitle: "Finance Officer",
      department: "Finance Unit",
      divisionId: "corporate-services-division"
    },
    {
      id: "3",
      name: "Anderson Yambe",
      email: "ayambe@scpng.gov.pg",
      jobTitle: "Senior Finance Officer",
      department: "Finance Unit",
      divisionId: "corporate-services-division"
    },
    {
      id: "5",
      name: "Eric Kipongi",
      email: "ekipongi@scpng.gov.pg",
      jobTitle: "Manager Information Technology",
      department: "IT Unit",
      divisionId: "corporate-services-division"
    },
    {
      id: "13",
      name: "John Sarwom",
      email: "jsarwom@scpng.gov.pg",
      jobTitle: "Senior IT Database Officer",
      department: "IT Unit",
      divisionId: "corporate-services-division"
    },
    {
      id: "15",
      name: "Joel Johnny Waiya",
      email: "jwaiya@scpng.gov.pg",
      jobTitle: "Senior Human Resource Officer",
      department: "Human Resources Unit",
      divisionId: "corporate-services-division"
    },
    {
      id: "22",
      name: "Mark Timea",
      email: "mtimea@scpng.gov.pg",
      jobTitle: "Admin Officer",
      department: "Human Resources Unit",
      divisionId: "corporate-services-division"
    },
    {
      id: "23",
      name: "Mercy Tipitap",
      email: "mtipitap@scpng.gov.pg",
      jobTitle: "Senior Finance Officer",
      department: "Finance Unit",
      divisionId: "corporate-services-division"
    },
    {
      id: "27",
      name: "Sisia Asigau",
      email: "sasigau@scpng.gov.pg",
      jobTitle: "Receptionist",
      department: "Corporate Service Division",
      divisionId: "corporate-services-division"
    },
    {
      id: "28",
      name: "Sulluh Kamitu",
      email: "skamitu@scpng.gov.pg",
      jobTitle: "Senior HR Officer",
      department: "HR Department",
      divisionId: "corporate-services-division"
    },
    {
      id: "29",
      name: "Sophia Marai",
      email: "smarai@scpng.gov.pg",
      jobTitle: "Receptionist",
      department: "Human Resources Unit",
      divisionId: "corporate-services-division"
    },
    {
      id: "30",
      name: "Sam Taki",
      email: "staki@scpng.gov.pg",
      jobTitle: "Acting Director Corporate Service",
      department: "Finance Unit",
      divisionId: "corporate-services-division"
    }
  ],
  'licensing-market-supervision-division': [
    {
      id: "4",
      name: "Esther Alia",
      email: "ealia@scpng.gov.pg",
      jobTitle: "Market Data Officer",
      department: "Market Data Unit",
      divisionId: "licensing-market-supervision-division"
    },
    {
      id: "10",
      name: "Jacob Kom",
      email: "jkom@scpng.gov.pg",
      jobTitle: "Senior Investigations Officer",
      department: "Investigations Unit",
      divisionId: "licensing-market-supervision-division"
    },
    {
      id: "26",
      name: "Regina Wai",
      email: "rwai@scpng.gov.pg",
      jobTitle: "Senior Supervision Officer",
      department: "Supervision Unit",
      divisionId: "licensing-market-supervision-division"
    },
    {
      id: "31",
      name: "Titus Angu",
      email: "tangu@scpng.gov.pg",
      jobTitle: "Supervision Officer",
      department: "Supervision Unit",
      divisionId: "licensing-market-supervision-division"
    },
    {
      id: "35",
      name: "Zomay Apini",
      email: "zapini@scpng.gov.pg",
      jobTitle: "Market Data Manager",
      department: "Market Data Unit",
      divisionId: "licensing-market-supervision-division"
    }
  ],
  'legal-services-division': [
    {
      id: "7",
      name: "Isaac Mel",
      email: "imel@scpng.gov.pg",
      jobTitle: "Senior Legal Officer Enforcement & Compliance",
      department: "Legal Advisory Unit",
      divisionId: "legal-services-division"
    },
    {
      id: "8",
      name: "Immanuel Minoga",
      email: "iminoga@scpng.gov.pg",
      jobTitle: "Legal Officer",
      department: "Legal Advisory Unit",
      divisionId: "legal-services-division"
    },
    {
      id: "14",
      name: "Johnson Tengere",
      email: "jtengere@scpng.gov.pg",
      jobTitle: "Legal Clark",
      department: "Legal Advisory Unit",
      divisionId: "legal-services-division"
    },
    {
      id: "32",
      name: "Tony Kawas",
      email: "tkawas@scpng.gov.pg",
      jobTitle: "Senior Legal Officer",
      department: "Legal Advisory Unit",
      divisionId: "legal-services-division"
    },
    {
      id: "34",
      name: "Tyson Yapao",
      email: "tyapao@scpng.gov.pg",
      jobTitle: "Legal Manager - Compliance & Enforcement",
      department: "Legal Advisory Unit",
      divisionId: "legal-services-division"
    }
  ],
  'research-publication-division': [
    {
      id: "6",
      name: "Howard Bando",
      email: "hbando@scpng.gov.pg",
      jobTitle: "Publication Officer",
      department: "Media & Publication Unit",
      divisionId: "research-publication-division"
    },
    {
      id: "11",
      name: "Joy Komba",
      email: "jkomba@scpng.gov.pg",
      jobTitle: "Director Research & Publication",
      department: "Research & Publication",
      divisionId: "research-publication-division"
    },
    {
      id: "24",
      name: "Newman Tandawai",
      email: "ntandawai@scpng.gov.pg",
      jobTitle: "Research Officer",
      department: "Research Unit",
      divisionId: "research-publication-division"
    }
  ],
  'secretariat-unit': [
    {
      id: "12",
      name: "Joyce Nii",
      email: "jnii@scpng.gov.pg",
      jobTitle: "Executive Secretary",
      department: "Secretariat Unit",
      divisionId: "secretariat-unit"
    },
    {
      id: "16",
      name: "Lovelyn Karlyo",
      email: "lkarlyo@scpng.gov.pg",
      jobTitle: "Divisional Secretary",
      department: "Secretariat Unit",
      divisionId: "secretariat-unit"
    }
  ]
};

export class DivisionStaffMap {
  // Get all staff members
  static getAllStaff(): StaffMember[] {
    return Object.values(staffByDivision).flat();
  }

  // Get staff members for a specific division
  static getStaffByDivision(divisionId: string): StaffMember[] {
    return staffByDivision[divisionId] || [];
  }

  // Get staff member by email
  static getStaffByEmail(email: string): StaffMember | undefined {
    return this.getAllStaff().find(
      staff => staff.email.toLowerCase() === email.toLowerCase()
    );
  }

  // Get staff members for the current user's division
  static getStaffForUserDivision(userEmail: string): StaffMember[] {
    const userStaff = this.getStaffByEmail(userEmail);
    if (!userStaff) return [];
    
    return this.getStaffByDivision(userStaff.divisionId);
  }
}

export default DivisionStaffMap; 