interface StaffMember {
  id: string;
  name: string;
  email: string;
  job_title: string;
  department: string;
  mobile: string; 
  business_phone: string;
  office_location: string;
  division_id: string;
}

// Staff organized by division (mapping from database values in screenshot)
const staffByDivision: Record<string, StaffMember[]> = {
  'executive-division': [
    {
      id: "6",
      name: "Andy Ambulu",
      email: "aambulu@scpng.gov.pg",
      job_title: "General Counsel",
      department: "Secretariat Unit",
      mobile: "+675 74235369",
      business_phone: "+675 321 2223",
      office_location: "Executive Division",
      division_id: "executive-division"
    },
    {
      id: "7",
      name: "James Joshua",
      email: "jjoshua@scpng.gov.pg",
      job_title: "Acting Chief Executive Officer",
      department: "Executive Division",
      mobile: "N/A",
      business_phone: "+675 321 2223",
      office_location: "Office of the Chairman",
      division_id: "executive-division"
    },
  ],
  'corporate-services-division': [
    {
      id: "9",
      name: "Anita Kosnga",
      email: "akosnga@scpng.gov.pg",
      job_title: "Finance Officer",
      department: "Finance Unit",
      mobile: "+675 79632655",
      business_phone: "+675 3212223",
      office_location: "Corporate Services Division",
      division_id: "corporate-services-division"
    },
    {
      id: "11",
      name: "Eric Kipongi",
      email: "ekipongi@scpng.gov.pg",
      job_title: "Manager Information Technology",
      department: "IT Unit",
      mobile: "+675 75652192",
      business_phone: "+675 321 2223",
      office_location: "Corporate Service Division",
      division_id: "corporate-services-division"
    },
    {
      id: "12",
      name: "John Sarwom",
      email: "jsarwom@scpng.gov.pg",
      job_title: "Senior IT Database Officer",
      department: "IT Unit",
      mobile: "+675 77508555",
      business_phone: "+675 321 2223",
      office_location: "Corporate Services Division",
      division_id: "corporate-services-division"
    },
    {
      id: "13",
      name: "Joel Johnny Waiya",
      email: "jwaiya@scpng.gov.pg",
      job_title: "Senior Human Resource Officer",
      department: "Human Resources Unit",
      mobile: "+675 71882467",
      business_phone: "+675 321 2223",
      office_location: "Corporate Services Division",
      division_id: "corporate-services-division"
    },
    {
      id: "17",
      name: "Mark Timea",
      email: "mtimea@scpng.gov.pg",
      job_title: "Admin Officer",
      department: "Human Resources Unit",
      mobile: "+675 71233953",
      business_phone: "+675 321 2223",
      office_location: "Corporate Service Division",
      division_id: "corporate-services-division"
    },
    {
      id: "18",
      name: "Mercy Tipitap",
      email: "mtipitap@scpng.gov.pg",
      job_title: "Senior Finance Officer",
      department: "Finance Unit",
      mobile: "+675 72103762",
      business_phone: "+675 321 2223",
      office_location: "Corporate Services Division",
      division_id: "corporate-services-division"
    },
    {
      id: "21",
      name: "Sophia Marai",
      email: "smarai@scpng.gov.pg",
      job_title: "Receptionist",
      department: "Human Resources Unit",
      mobile: "+675 70118699",
      business_phone: "Corporate Services Division",
      office_location: "Corporate Services Division",
      division_id: "corporate-services-division"
    },
    {
      id: "22",
      name: "Sam Taki",
      email: "staki@scpng.gov.pg",
      job_title: "Acting Director Corporate Service",
      department: "Finance Unit",
      mobile: "N/A",
      business_phone: "+675 321 2223",
      office_location: "Corporate Services Division",
      division_id: "corporate-services-division"
    },
    {
      id: "23",
      name: "Thomas Mondaya",
      email: "tmondaya@scpng.gov.pg",
      job_title: "Senior Payroll Officer",
      department: "Human Resources Unit",
      mobile: "+675 71208950",
      business_phone: "+675 3212223",
      office_location: "Corporate Services Division",
      division_id: "corporate-services-division"
    },
    {
      id: "44",
      name: "SCPNG Boardroom",
      email: "boardroom@scpng.gov.pg",
      job_title: "Facility",
      department: "Corporate Services Division",
      mobile: "N/A",
      business_phone: "+675 321 2223",
      office_location: "Level 2 MRDC Haus, Downtown",
      division_id: "corporate-services-division"
    },
    {
      id: "51",
      name: "SCPNG Office",
      email: "SCPNGOffice@scpng.gov.pg",
      job_title: "Service Account",
      department: "Administrative Services",
      mobile: "N/A",
      business_phone: "N/A",
      office_location: "Corporate Services Division",
      division_id: "corporate-services-division"
    }
  ],
  'licensing-market-supervision-division': [
    {
      id: "24",
      name: "Esther Alia",
      email: "ealia@scpng.gov.pg",
      job_title: "Market Data Officer",
      department: "Market Data Unit",
      mobile: "+675 74410228",
      business_phone: "+675 321 2223",
      office_location: "Licensing Market & Supervision Division",
      division_id: "licensing-market-supervision-division"
    },
    {
      id: "25",
      name: "Jacob Kom",
      email: "jkom@scpng.gov.pg",
      job_title: "Senior Investigations Officer",
      department: "Investigations Unit",
      mobile: "N/A",
      business_phone: "+675 321 2223",
      office_location: "Licensing Market & Supervision Division",
      division_id: "licensing-market-supervision-division"
    },
    {
      id: "26",
      name: "Leeroy Wari",
      email: "lwari@scpng.gov.pg",
      job_title: "Senior Licensing Officer",
      department: "Licensing Unit",
      mobile: "+675 70287992",
      business_phone: "+675 321 2223",
      office_location: "Licensing Market & Supervision Division",
      division_id: "licensing-market-supervision-division"
    },
    {
      id: "27",
      name: "Mac Siwi",
      email: "msiwi@scpng.gov.pg",
      job_title: "Investigation Officer",
      department: "Investigations Unit",
      mobile: "+675 75640288",
      business_phone: "+675 321 2223",
      office_location: "Licensing Market & Supervision Division",
      division_id: "licensing-market-supervision-division"
    },
    {
      id: "28",
      name: "Regina Wai",
      email: "rwai@scpng.gov.pg",
      job_title: "Senior Supervision Officer",
      department: "Supervision Unit",
      mobile: "+675 72818920/75709357",
      business_phone: "+675 321 2223",
      office_location: "Licensing Market & Supervision Division",
      division_id: "licensing-market-supervision-division"
    },
    {
      id: "30",
      name: "Zomay Apini",
      email: "zapini@scpng.gov.pg",
      job_title: "Market Data Manager",
      department: "Market Data Unit",
      mobile: "+675 70553451",
      business_phone: "+675 321 2223",
      office_location: "Licensing Market & Supervision Division",
      division_id: "licensing-market-supervision-division"
    },
    {
      id: "48",
      name: "Licenses Group",
      email: "license@scpng.gov.pg",
      job_title: "Information Service",
      department: "Licensing Unit",
      mobile: "N/A",
      business_phone: "N/A",
      office_location: "Licensing Market & Supervision Division",
      division_id: "licensing-market-supervision-division"
    }
  ],
  'legal-services-division': [
    {
      id: "31",
      name: "Isaac Mel",
      email: "imel@scpng.gov.pg",
      job_title: "Senior Legal Officer Enforcement & Compliance",
      department: "Legal Advisory Unit",
      mobile: "+675 74301320",
      business_phone: "+675 321 2223",
      office_location: "Legal Services Division",
      division_id: "legal-services-division"
    },
    {
      id: "32",
      name: "Immanuel Minoga",
      email: "iminoga@scpng.gov.pg",
      job_title: "Legal Officer",
      department: "Legal Advisory Unit",
      mobile: "+675 71105474",
      business_phone: "+675 321 2223",
      office_location: "Legal Services Division",
      division_id: "legal-services-division"
    },
    {
      id: "33",
      name: "Johnson Tengere",
      email: "jtengere@scpng.gov.pg",
      job_title: "Legal Clark",
      department: "Legal Advisory Unit",
      mobile: "+675 72417196",
      business_phone: "+675 321 2223",
      office_location: "Legal Division",
      division_id: "legal-services-division"
    },
    {
      id: "34",
      name: "Tony Kawas",
      email: "tkawas@scpng.gov.pg",
      job_title: "Senior Legal Officer",
      department: "Legal Advisory Unit",
      mobile: "N/A",
      business_phone: "+675 321 2223",
      office_location: "Legal Services Division",
      division_id: "legal-services-division"
    },
    {
      id: "35",
      name: "Tyson Yapao",
      email: "tyapao@scpng.gov.pg",
      job_title: "Legal Manager - Compliance & Enforcement",
      department: "Legal Advisory Unit",
      mobile: "+675 78314741",
      business_phone: "+675 321 2223",
      office_location: "Legal Advisory Division",
      division_id: "legal-services-division"
    }
  ],
  'research-publication-division': [
    {
      id: "37",
      name: "Joy Komba",
      email: "jkomba@scpng.gov.pg",
      job_title: "Director Research & Publication",
      department: "Research & Publication",
      mobile: "+675 78158586/71183624",
      business_phone: "+675 321 2223",
      office_location: "Research & Publication",
      division_id: "research-publication-division"
    },
  ],
  'secretariat-unit': [
    {
      id: "40",
      name: "Lovelyn Karlyo",
      email: "lkarlyo@scpng.gov.pg",
      job_title: "Divisional Secretary",
      department: "Secretariat Unit",
      mobile: "+675 71723255",
      business_phone: "+675 321 2223",
      office_location: "Office of the Chairman",
      division_id: "secretariat-unit"
    },
    {
      id: "43",
      name: "General Enquiries",
      email: "ask@scpng.gov.pg",
      job_title: "Information Service",
      department: "Public Relations",
      mobile: "N/A",
      business_phone: "N/A",
      office_location: "Secretariat Unit",
      division_id: "secretariat-unit"
    },
    {
      id: "49",
      name: "Client/Investor Enquiries",
      email: "queries@scpng.gov.pg",
      job_title: "Information Service",
      department: "Public Relations",
      mobile: "N/A",
      business_phone: "N/A",
      office_location: "Secretariat Unit",
      division_id: "secretariat-unit"
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

  // Get staff member by name
  static getStaffByName(name: string): StaffMember | undefined {
    return this.getAllStaff().find(
      staff => staff.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Get staff members for the current user's division
  static getStaffForUserDivision(userEmail: string): StaffMember[] {
    const userStaff = this.getStaffByEmail(userEmail);
    if (!userStaff) return [];
    
    return this.getStaffByDivision(userStaff.division_id);
  }
}

export default DivisionStaffMap; 