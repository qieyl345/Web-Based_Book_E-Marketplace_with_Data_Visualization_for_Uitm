// Role Filter Enhancement for Admin Dashboard
// This script adds role filtering tabs to the users table

document.addEventListener('DOMContentLoaded', () => {
    console.log('[ROLE-FILTER] Initializing role filter tabs');

    // Wait for admin.js to finish loading its data
    // Listen for when allUsers is available
    function checkDataAndInit() {
        if (window.allUsers && window.allUsers.length >= 0) {
            addRoleFilterTabs();
        } else {
            // Retry after a short delay
            setTimeout(checkDataAndInit, 500);
        }
    }

    // Start checking after DOM is fully loaded
    setTimeout(checkDataAndInit, 1000);
});

let currentRoleFilter = 'all';

function addRoleFilterTabs() {
    const usersTableCard = document.querySelector('.tables-grid .table-card:nth-child(2)');
    if (!usersTableCard) {
        console.log('[ROLE-FILTER] Users table card not found');
        return;
    }

    const tableHeader = usersTableCard.querySelector('.table-header');
    const tableResponsive = usersTableCard.querySelector('.table-responsive');

    if (!tableHeader || !tableResponsive) {
        console.log('[ROLE-FILTER] Required elements not found');
        return;
    }

    // Update header title
    const headerTitle = tableHeader.querySelector('h3');
    if (headerTitle) {
        headerTitle.textContent = 'Users Management';
    }

    // Create role filter tabs
    const roleTabsHTML = `
        <div class="role-filter-tabs" style="display: flex; gap: 0.5rem; padding: 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap;">
            <button class="role-tab active" data-role="all" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; border: none; background: var(--primary-uitm); color: white; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; font-size: 0.875rem;">
                All Users <span class="tab-badge" id="countAll" style="background: rgba(255,255,255,0.3); padding: 0.25rem 0.5rem; border-radius: 12px; margin-left: 0.5rem;">0</span>
            </button>
            <button class="role-tab" data-role="admin" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; background: white; color: #64748b; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; font-size: 0.875rem;">
                <i class="fas fa-user-shield"></i> Admins <span class="tab-badge" id="countAdmin" style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 12px; margin-left: 0.5rem;">0</span>
            </button>
            <button class="role-tab" data-role="student" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; background: white; color: #64748b; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; font-size: 0.875rem;">
                <i class="fas fa-user-graduate"></i> Students <span class="tab-badge" id="countStudent" style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 12px; margin-left: 0.5rem;">0</span>
            </button>
            <button class="role-tab" data-role="staff" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; background: white; color: #64748b; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; font-size: 0.875rem;">
                <i class="fas fa-user-tie"></i> Staff <span class="tab-badge" id="countStaff" style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 12px; margin-left: 0.5rem;">0</span>
            </button>
        </div>
    `;

    // Insert tabs before table
    tableResponsive.insertAdjacentHTML('beforebegin', roleTabsHTML);

    // Set up tab click handlers
    setupRoleFilterHandlers();

    // Update counts if users are already loaded
    if (window.allUsers) {
        updateRoleCounts();
    }

    console.log('[ROLE-FILTER] Role filter tabs added successfully');
}

function setupRoleFilterHandlers() {
    const roleTabs = document.querySelectorAll('.role-tab');

    roleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const role = tab.getAttribute('data-role');
            currentRoleFilter = role;

            // Update active state
            roleTabs.forEach(t => {
                if (t === tab) {
                    t.classList.add('active');
                    t.style.background = 'var(--primary-uitm)';
                    t.style.color = 'white';
                    t.style.border = 'none';
                    const badge = t.querySelector('.tab-badge');
                    if (badge) {
                        badge.style.background = 'rgba(255,255,255,0.3)';
                        badge.style.color = 'white';
                    }
                } else {
                    t.classList.remove('active');
                    t.style.background = 'white';
                    t.style.color = '#64748b';
                    t.style.border = '1px solid #e2e8f0';
                    const badge = t.querySelector('.tab-badge');
                    if (badge) {
                        badge.style.background = '#f1f5f9';
                        badge.style.color = '#475569';
                    }
                }
            });

            // Filter users
            filterUsersByRole(role);

            console.log(`[ROLE-FILTER] Filtered by role: ${role}`);
        });
    });
}

function filterUsersByRole(role) {
    if (!window.allUsers) {
        console.log('[ROLE-FILTER] allUsers not available yet');
        return;
    }

    let filteredUsers = window.allUsers;

    if (role !== 'all') {
        filteredUsers = window.allUsers.filter(user => user.role === role);
    }

    // Update the users table with filtered results
    displayFilteredUsers(filteredUsers);
}

function displayFilteredUsers(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem; color: #64748b;">No users found for this role</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.fullName || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.role || 'N/A'}</td>
            <td>${user.totalSales || 0}</td>
            <td><span class="status-badge active">Active</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewUser('${user.uid || ''}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateRoleCounts() {
    if (!window.allUsers) return;

    const counts = {
        all: window.allUsers.length,
        admin: 0,
        student: 0,
        staff: 0
    };

    window.allUsers.forEach(user => {
        const role = user.role;
        if (counts.hasOwnProperty(role)) {
            counts[role]++;
        }
    });

    // Update badge counts - safely check if elements exist
    const countAllEl = document.getElementById('countAll');
    const countAdminEl = document.getElementById('countAdmin');
    const countStudentEl = document.getElementById('countStudent');
    const countStaffEl = document.getElementById('countStaff');

    if (countAllEl) countAllEl.textContent = counts.all;
    if (countAdminEl) countAdminEl.textContent = counts.admin;
    if (countStudentEl) countStudentEl.textContent = counts.student;
    if (countStaffEl) countStaffEl.textContent = counts.staff;

    console.log('[ROLE-FILTER] Role counts updated:', counts);
}

// Export functions for use in admin.js
window.filterUsersByRole = filterUsersByRole;
window.updateRoleCounts = updateRoleCounts;
