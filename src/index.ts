import fetch from 'node-fetch';

const snykToken: any = process.env.SNYK_TOKEN;
const restApiVersion: string = '2023-09-14'
const restBetaApiVersion: string = '2023-09-14~beta'

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

async function returnProjectCountPerOrganization() {
    let orgIdAndName: any = await fetchOrgs()

    // Looping through org IDs and returning project count
    for (const orgData of orgIdAndName) {
        let projectCount: any = await fetchProjectsCount(orgData.id);
        let targetCount: any = await fetchTargetCount(orgData.id);

        console.log("Snyk Organziation " + orgData.name + " has " + JSON.stringify(projectCount) + " projects and " + + JSON.stringify(targetCount) + " targets")
    }
}

async function fetchTargetCount(orgId: string) {
    let url: string = `https://api.snyk.io/rest/orgs/${orgId}/targets?version=${restBetaApiVersion}&limit=100`
    let hasNextLink = true;
    let targetCount = 0;

    while (hasNextLink) {
        try {
            // Calling Snyk Rest Targets endpoint
            const response: any = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    'Authorization': `token ${snykToken}`
                }
            });

            if (response.status == 200) {
                const targetData: any = await response.json()
                // Counting targets
                targetCount = targetCount + Object.keys(targetData.data).length

                // Checking for more pages
                if (targetData.links && targetData.links.next) {
                    hasNextLink = true
                    url = "https://api.snyk.io/rest" + targetData.links.next
                }
                else {
                    hasNextLink = false
                    return targetCount;
                }
            }

        } catch (error) {
            console.log('There was an error fetching data from targets endpoint', {
                extra: {
                    errors: JSON.stringify(error),
                },
            });
            hasNextLink = false
        }
    }

}

async function fetchProjectsCount(orgId: string) {
    let url: string = `https://api.snyk.io/rest/orgs/${orgId}/projects?version=${restApiVersion}&limit=100`
    let hasNextLink = true;
    let projectCount = 0;

    while (hasNextLink) {
        try {
            // Calling Snyk Rest Projects endpoint
            const response: any = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    'Authorization': `token ${snykToken}`
                }
            });

            if (response.status == 200) {
                const projectData: any = await response.json()
                // Counting projects
                projectCount = projectCount + Object.keys(projectData.data).length

                // Checking for more pages
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
    while (hasNextLink) {
        try {

            // Calling Snyk Rest orgs endpoint
            const response: any = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    'Authorization': `token ${snykToken}`
                }
            });

            if (response.status == 200) {
                const orgData: OrgData = await response.json()

                for (const i of orgData.data) {
                    const orgDataHolder: OrgInfo = {
                        id: i.id,
                        name: i.attributes.name
                    };

                    orgInfo.push(orgDataHolder)
                }

                // Checking for more pages
                if (orgData.links && orgData.links.next) {
                    hasNextLink = true
                    url = "https://api.snyk.io" + orgData.links.next
                }
                else {
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

// Running app
returnProjectCountPerOrganization()
