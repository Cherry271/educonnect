import { useState, useEffect } from 'react';
import { Users, Plus, Check, ChevronRight } from 'lucide-react';
import { groupsApi } from '../api/client';

interface GroupCard {
  id: string;
  name: string;
  membersCount: number;
  tag: string;
  status: 'Active Now' | 'Trending' | 'New' | 'Quiet';
  color: string;
  category: 'all' | 'courses' | 'labs' | 'clubs';
}

const initialGroups: GroupCard[] = [
  {
    id: 'grp_1',
    name: 'Quantum Computing',
    membersCount: 1240,
    tag: 'Research',
    status: 'Active Now',
    color: 'bg-blue-600',
    category: 'labs'
  },
  {
    id: 'grp_2',
    name: 'Ethical AI Collective',
    membersCount: 850,
    tag: 'Ethics',
    status: 'Trending',
    color: 'bg-purple-600',
    category: 'clubs'
  },
  {
    id: 'grp_3',
    name: 'Bio-Engineering 101',
    membersCount: 3400,
    tag: 'Academic',
    status: 'Active Now',
    color: 'bg-green-600',
    category: 'courses'
  },
  {
    id: 'grp_4',
    name: 'Carbon Capture Init...',
    membersCount: 620,
    tag: 'Sustainability',
    status: 'New',
    color: 'bg-lime-500',
    category: 'labs'
  },
  {
    id: 'grp_5',
    name: 'Neural Networks St...',
    membersCount: 2100,
    tag: 'AI',
    status: 'Active Now',
    color: 'bg-orange-500',
    category: 'courses'
  },
  {
    id: 'grp_6',
    name: 'Medieval History So...',
    membersCount: 430,
    tag: 'Humanities',
    status: 'Quiet',
    color: 'bg-amber-800',
    category: 'clubs'
  }
];

export default function GroupsView() {
  const [filter, setFilter] = useState<'all' | 'courses' | 'labs' | 'clubs'>('all');
  const [groups, setGroups] = useState<GroupCard[]>(initialGroups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTag, setNewGroupTag] = useState('Research');
  const [newGroupCategory, setNewGroupCategory] = useState<'courses' | 'labs' | 'clubs'>('courses');
  const [newGroupColor, setNewGroupColor] = useState('bg-blue-600');

  useEffect(() => {
    // Attempt to load from backend API if active
    const fetchGroups = async () => {
      try {
        const response = await groupsApi.list();
        if (response.data && response.data.items && response.data.items.length > 0) {
          // Map backend groups to our cards
          const mapped: GroupCard[] = response.data.items.map((g: any, idx: number) => ({
            id: g.id || `backend_${idx}`,
            name: g.name,
            membersCount: (g.members || []).length || Math.floor(Math.random() * 500) + 50,
            tag: g.department || 'General',
            status: idx % 3 === 0 ? 'Active Now' : idx % 3 === 1 ? 'Trending' : 'New',
            color: idx % 4 === 0 ? 'bg-blue-600' : idx % 4 === 1 ? 'bg-purple-600' : idx % 4 === 2 ? 'bg-green-600' : 'bg-orange-500',
            category: g.group_type === 'study' ? 'courses' : 'labs'
          }));
          
          // Merge with initial groups (preventing duplicates)
          const merged = [...initialGroups];
          mapped.forEach(mg => {
            if (!merged.some(eg => eg.name.toLowerCase() === mg.name.toLowerCase())) {
              merged.push(mg);
            }
          });
          setGroups(merged);
        }
      } catch (e) {
        console.log("Backend offline or failed fetching groups, using mock data.", e);
      }
    };
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: GroupCard = {
      id: `grp_${Date.now()}`,
      name: newGroupName,
      membersCount: 1,
      tag: newGroupTag,
      status: 'New',
      color: newGroupColor,
      category: newGroupCategory
    };

    // Attempt backend creation
    try {
      await groupsApi.create({
        name: newGroupName,
        description: `Collaboration hub for ${newGroupName}`,
        group_type:
          newGroupCategory === 'courses'
            ? 'course'
            : newGroupCategory === 'labs'
            ? 'project'
            : 'department',
        department: newGroupTag,
        is_private: false
      });
    } catch (err) {
      console.log("Backend offline, saving locally only", err);
    }

    setGroups([newGroup, ...groups]);
    setNewGroupName('');
    setIsModalOpen(false);
  };

  const filteredGroups = groups.filter(
    g => filter === 'all' || g.category === filter
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Academic Groups & Hubs</h1>
          <p className="text-gray-400 text-sm mt-1">Collaborate with peers across disciplines and institutions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-400 hover:bg-primary-300 text-dark-bg font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors self-start md:self-auto text-sm cursor-pointer"
        >
          <Plus size={16} />
          Create New Hub
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-dark-card border-primary-400 text-white font-bold'
              : 'bg-dark-card/50 border-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          {filter === 'all' && <Check size={12} className="text-primary-400" />}
          All Groups
        </button>
        <button
          onClick={() => setFilter('courses')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            filter === 'courses'
              ? 'bg-dark-card border-primary-400 text-white font-bold'
              : 'bg-dark-card/50 border-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          {filter === 'courses' && <Check size={12} className="text-primary-400" />}
          My Courses
        </button>
        <button
          onClick={() => setFilter('labs')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            filter === 'labs'
              ? 'bg-dark-card border-primary-400 text-white font-bold'
              : 'bg-dark-card/50 border-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          {filter === 'labs' && <Check size={12} className="text-primary-400" />}
          Research Labs
        </button>
        <button
          onClick={() => setFilter('clubs')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            filter === 'clubs'
              ? 'bg-dark-card border-primary-400 text-white font-bold'
              : 'bg-dark-card/50 border-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          {filter === 'clubs' && <Check size={12} className="text-primary-400" />}
          Interest Clubs
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGroups.map(group => (
          <div
            key={group.id}
            className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 hover:border-gray-800 transition-all flex flex-col justify-between h-[190px]"
          >
            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${group.color}`}>
                <Users className="text-white" size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-bold text-base tracking-wide truncate">{group.name}</h3>
                <p className="text-gray-400 text-xs mt-0.5">{group.membersCount.toLocaleString()} members</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-900/50">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                group.status === 'Active Now'
                  ? 'bg-emerald-950 text-primary-400'
                  : group.status === 'Trending'
                  ? 'bg-teal-950 text-teal-400'
                  : group.status === 'New'
                  ? 'bg-cyan-950 text-cyan-400'
                  : 'bg-gray-950 text-gray-400'
              }`}>
                {group.status}
              </span>
              <span className="text-gray-400 text-xs font-medium">{group.tag}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pinned Discussions */}
      <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white tracking-wide">Pinned Discussions</h2>
          <button className="text-primary-400 hover:text-primary-300 text-xs font-bold transition-colors cursor-pointer">
            View All
          </button>
        </div>

        <div className="divide-y divide-gray-900">
          <div className="flex items-center justify-between py-3 hover:bg-white/[0.01] transition-colors rounded-lg px-2 cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#202221] flex items-center justify-center text-primary-400 font-bold text-sm border border-gray-900">
                EV
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm group-hover:text-primary-400 transition-colors">
                  Latest Breakthrough in Superconductivity
                </h4>
                <p className="text-gray-400 text-xs mt-0.5">
                  Started by <span className="text-gray-300">Dr. Elena Vance</span> • 42 replies
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-600 group-hover:text-gray-400 transition-colors" size={18} />
          </div>

          <div className="flex items-center justify-between py-3 pt-4 hover:bg-white/[0.01] transition-colors rounded-lg px-2 cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#202221] flex items-center justify-center text-primary-400 font-bold text-sm border border-gray-900">
                MT
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm group-hover:text-primary-400 transition-colors">
                  Best practices for large-scale data cleaning
                </h4>
                <p className="text-gray-400 text-xs mt-0.5">
                  Started by <span className="text-gray-300">Marcus Thorne</span> • 128 replies
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-600 group-hover:text-gray-400 transition-colors" size={18} />
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#161616] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-4">Create New Academic Hub</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1.5">Hub Name</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Nanotech Research"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:border-primary-400 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-1.5">Tag / Topic</label>
                  <input
                    type="text"
                    value={newGroupTag}
                    onChange={e => setNewGroupTag(e.target.value)}
                    placeholder="e.g. Nanotech"
                    className="w-full bg-[#202221] border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:border-primary-400 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase mb-1.5">Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={e => setNewGroupCategory(e.target.value as any)}
                    className="w-full bg-[#202221] border border-gray-800 rounded-lg py-2 px-3 text-white text-sm focus:border-primary-400 focus:outline-hidden"
                  >
                    <option value="courses">My Courses</option>
                    <option value="labs">Research Labs</option>
                    <option value="clubs">Interest Clubs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1.5">Color Scheme</label>
                <div className="flex gap-2.5">
                  {[
                    { value: 'bg-blue-600', label: 'Blue' },
                    { value: 'bg-purple-600', label: 'Purple' },
                    { value: 'bg-green-600', label: 'Green' },
                    { value: 'bg-orange-500', label: 'Orange' },
                    { value: 'bg-red-600', label: 'Red' },
                    { value: 'bg-pink-600', label: 'Pink' }
                  ].map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewGroupColor(c.value)}
                      className={`w-6 h-6 rounded-full ${c.value} border-2 ${
                        newGroupColor === c.value ? 'border-white scale-110' : 'border-transparent'
                      } transition-all`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-800 text-gray-400 hover:text-white rounded-lg py-2 text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-400 hover:bg-primary-300 text-dark-bg font-bold rounded-lg py-2 text-sm transition-colors cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
