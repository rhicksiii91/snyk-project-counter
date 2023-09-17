import fetch from 'node-fetch';

const snykToken: any = process.env.SNYK_TOKEN;
const restApiVersion: string = '2023-09-14'

interface OrgInfo {
    id: string;
    name: string;

}

interface OrgData {
    data: [{
        id: string,
        attributes: {
            group_id: string
            name: string
        }
    }],
    links: {
        next: string
    }
}

interface OrgProjectData {
    orgName: string;
    projectCount: string;

}

async function returnProjectCountPreOrganization(){
    let orgIdAndName: any = await fetchOrgs()
    const OrgProjectCountData: OrgProjectData[] = [];

    for (const orgData of orgIdAndName) {
        let projectCount: any = await fetchProjects(orgData.id);
        const csvData: OrgProjectData = {
            orgName: orgData.name,
            projectCount: projectCount,
        }
        OrgProjectCountData.push(csvData)
        
        console.log("Snyk Organziation " + orgData.name + " has " + JSON.stringify(projectCount) + " projects" )
    }
    const data: any = OrgProjectCountData
}

async function fetchProjects(orgId: string) {
    let url: string = `https://api.snyk.io/rest/orgs/${orgId}/projects?version=${restApiVersion}&limit=100`
    let hasNextLink = true;
    const projectInfo: any[] = [];
    let projectCount = 0;

    // console.log("Starting to collect Projects data for " + orgName + " Snyk Organization")
    while (hasNextLink) {
        try {
            const response: any = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    'Authorization': `token ${snykToken}`
                }
            });

            if (response.status == 200) {
                // console.log("Found projects")
                const projectData: any  = await response.json()

                // console.log("Here is the project data " + JSON.stringify(projectData.data))
                projectCount = projectCount + Object.keys(projectData.data).length
                // console.log("Here is the project count " + projectCount)

                // for (const i of projectData.data) {
                //     const orgDataHolder: OrgInfo = {
                //         id: i.id,
                //         name: i.attributes.name
                //     };

                //     orgInfo.push(orgDataHolder)
                // }

                if (projectData.links && projectData.links.next) {
                    hasNextLink = true
                    url = "https://api.snyk.io" + projectData.links.next
                }
                else {
                    hasNextLink = false
                    return projectCount;
                }
            }

        } catch (error) {
            console.log('There was an error fetching data from projects endpoint', {
                extra: {
                    errors: JSON.stringify(error),
                },
            });
            hasNextLink = false
        }
    }

}

async function fetchOrgs() {
    let url: string = "https://api.snyk.io/rest/orgs?";
    let hasNextLink = true;
    const orgInfo: OrgInfo[] = [];
    let paramsString: any = { version: restApiVersion, limit: "10", }
    url = url + new URLSearchParams(paramsString)

    console.log("Starting to collect Organization data")
    while (hasNextLink){
        try {

            const response: any = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    'Authorization': `token ${snykToken}`
                }
            });

            if (response.status == 200){
                const orgData: OrgData = await response.json()

                for (const i of orgData.data){
                    const orgDataHolder: OrgInfo = {
                        id: i.id,
                        name: i.attributes.name
                    };

                    orgInfo.push(orgDataHolder)
                }

                if (orgData.links && orgData.links.next) {
                    hasNextLink = true
                    url = "https://api.snyk.io" + orgData.links.next
                }
                else{
                    hasNextLink = false
                    return orgInfo;
                }
            }

        } catch (error) {
            console.log('There was an error fetching data from /orgs', {
                extra: {
                    errors: JSON.stringify(error),
                },
            });
            hasNextLink = false
        }
    }

    
}

returnProjectCountPreOrganization()
