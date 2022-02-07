npm run build

Connect-AzAccount

$resourceGroup = "multifactiondao"
$location = "eastus"
$storageAccountName = 'multifactiondao'
# Create Resource Group 
New-AzResourceGroup -Name $resourceGroup -Location $location
# Create Storage Account 
$storageAccount = New-AzStorageAccount -ResourceGroupName $resourceGroup `
    -Name $storageAccountName `
    -Location $location `
    -SkuName Standard_LRS  `
    -Kind StorageV2
$ctx = $storageAccount.Context
#Enable Static Website for Storage Account
Enable-AzStorageStaticWebsite -Context $ctx -IndexDocument index.html

$sasToken = New-AzStorageContainerSASToken -Name '$web' -Permission rwdl -Context $ctx
azcopy copy '.\build\*' ('https://'+$storageAccountName+'.blob.core.windows.net/$web'+$sasToken) --recursive $storageAccount.PrimaryEndpoints.Web